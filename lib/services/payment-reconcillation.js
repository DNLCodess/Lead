// lib/services/payment-reconciliation-service.js

/**
 * Payment Reconciliation Service
 * Handles edge cases where payment succeeds but unlock fails
 */

export class PaymentReconciliationService {
  /**
   * Strategy 1: Webhook Handler (Most Reliable)
   * Flutterwave sends webhook even if user closes browser
   */
  static async handleWebhook(webhookData) {
    try {
      const { transaction_id, tx_ref, status, customer } = webhookData;

      if (status !== "successful") {
        return { success: false, reason: "payment_not_successful" };
      }

      // Verify transaction with Flutterwave API
      const isValid = await this.verifyWithFlutterwave(transaction_id);

      if (!isValid) {
        console.error("Webhook verification failed for:", transaction_id);
        return { success: false, reason: "verification_failed" };
      }

      // Check if already processed (idempotency)
      const existingPayment = await this.getPaymentByTxRef(tx_ref);

      if (existingPayment?.weeks_unlocked) {
        return { success: true, reason: "already_processed" };
      }

      // Process the unlock with retry logic
      const unlockResult = await this.processUnlockWithRetry(
        transaction_id,
        tx_ref,
        3, // max retries
      );

      return unlockResult;
    } catch (error) {
      console.error("Webhook processing error:", error);

      // Log to monitoring system (e.g., Sentry)
      await this.logToMonitoring({
        error: error.message,
        webhookData,
        timestamp: new Date().toISOString(),
      });

      return { success: false, error: error.message };
    }
  }

  /**
   * Strategy 2: Retry Logic with Exponential Backoff
   */
  static async processUnlockWithRetry(
    transactionId,
    txRef,
    maxRetries = 3,
    attempt = 1,
  ) {
    try {
      const result = await fetch("/api/profile/unlock-weeks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transaction_id: transactionId, tx_ref: txRef }),
      });

      const data = await result.json();

      if (data.success) {
        return { success: true, data };
      }

      throw new Error(data.error || "Unlock failed");
    } catch (error) {
      if (attempt >= maxRetries) {
        console.error(`Max retries reached for ${txRef}:`, error);

        // Queue for manual reconciliation
        await this.queueForManualReconciliation(transactionId, txRef, error);

        return { success: false, error: error.message, queued: true };
      }

      // Exponential backoff: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));

      return this.processUnlockWithRetry(
        transactionId,
        txRef,
        maxRetries,
        attempt + 1,
      );
    }
  }

  /**
   * Strategy 3: Background Job for Failed Unlocks
   */
  static async queueForManualReconciliation(transactionId, txRef, error) {
    try {
      // Store in a "pending_reconciliation" table
      await fetch("/api/admin/reconciliation-queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction_id: transactionId,
          tx_ref: txRef,
          error: error.message,
          status: "pending",
          created_at: new Date().toISOString(),
          retry_count: 0,
        }),
      });

    } catch (err) {
      console.error("Failed to queue for reconciliation:", err);
    }
  }

  /**
   * Strategy 4: Periodic Reconciliation Job (Cron)
   * Runs every hour to check for missed payments
   */
  static async runReconciliationJob() {
    try {
      // Get all successful payments from last 24 hours
      const recentPayments = await this.getRecentSuccessfulPayments(24);

      for (const payment of recentPayments) {
        // Check if weeks were actually unlocked
        const isUnlocked = await this.checkIfWeeksUnlocked(
          payment.user_id,
          payment.tx_ref,
        );

        if (!isUnlocked) {
          // Attempt to unlock
          await this.processUnlockWithRetry(
            payment.transaction_id,
            payment.tx_ref,
            3,
          );
        }
      }

    } catch (error) {
      console.error("Reconciliation job error:", error);
    }
  }

  /**
   * Strategy 5: User Self-Service Recovery
   * Let users manually trigger unlock if payment succeeded
   */
  static async checkAndUnlockForUser(userId, transactionId) {
    try {
      // Verify payment with Flutterwave
      const verification = await this.verifyWithFlutterwave(transactionId);

      if (!verification.success) {
        return {
          success: false,
          error: "Payment verification failed",
        };
      }

      // Check if already unlocked
      const payment = await this.getPaymentByTransactionId(transactionId);

      if (payment?.weeks_unlocked) {
        return {
          success: true,
          message: "Weeks already unlocked",
        };
      }

      // Process unlock
      const result = await this.processUnlockWithRetry(
        transactionId,
        payment.tx_ref,
        3,
      );

      return result;
    } catch (error) {
      console.error("Self-service unlock error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Verify with Flutterwave API
   */
  static async verifyWithFlutterwave(transactionId) {
    try {
      const response = await fetch(
        `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        },
      );

      const data = await response.json();

      return {
        success:
          data.status === "success" && data.data?.status === "successful",
        data: data.data,
      };
    } catch (error) {
      console.error("Flutterwave verification error:", error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper: Get payment by tx_ref
   */
  static async getPaymentByTxRef(txRef) {
    // Replace with your actual database query
    try {
      const response = await fetch(`/api/payments/by-tx-ref/${txRef}`);
      return response.json();
    } catch (error) {
      console.error("Error fetching payment:", error);
      return null;
    }
  }

  /**
   * Helper: Get payment by transaction_id
   */
  static async getPaymentByTransactionId(transactionId) {
    try {
      const response = await fetch(
        `/api/payments/by-transaction-id/${transactionId}`,
      );
      return response.json();
    } catch (error) {
      console.error("Error fetching payment:", error);
      return null;
    }
  }

  /**
   * Helper: Get recent successful payments
   */
  static async getRecentSuccessfulPayments(hours = 24) {
    try {
      const response = await fetch(
        `/api/payments/recent?hours=${hours}&status=successful`,
      );
      return response.json();
    } catch (error) {
      console.error("Error fetching recent payments:", error);
      return [];
    }
  }

  /**
   * Helper: Check if weeks are unlocked
   */
  static async checkIfWeeksUnlocked(userId, txRef) {
    try {
      const response = await fetch(
        `/api/profile/check-unlock-status?user_id=${userId}&tx_ref=${txRef}`,
      );
      const data = await response.json();
      return data.unlocked;
    } catch (error) {
      console.error("Error checking unlock status:", error);
      return false;
    }
  }

  /**
   * Helper: Log to monitoring system
   */
  static async logToMonitoring(data) {
    // Integrate with Sentry, LogRocket, or similar
    console.error("CRITICAL - Payment reconciliation issue:", data);

    // Example: Sentry
    // Sentry.captureException(new Error('Payment unlock failed'), {
    //   extra: data
    // });
  }
}
