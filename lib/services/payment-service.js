import { supabase } from "@/lib/supabase/client";

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export class PaymentService {
  /**
   * Initialize payment with retry logic
   */
  static async initializePayment(registrationData, retryCount = 0) {
    try {
      // Validate data before sending
      if (
        !registrationData.email ||
        !registrationData.firstName ||
        !registrationData.lastName
      ) {
        throw new Error("Missing required registration data");
      }

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const response = await fetch(`${baseUrl}/api/payment/initialize`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registrationData),
        // Add timeout
        signal: AbortSignal.timeout(15000), // 15 second timeout
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          if (retryCount < MAX_RETRIES && response.status >= 500) {
            await delay(RETRY_DELAY * (retryCount + 1)); // Exponential backoff
            return this.initializePayment(registrationData, retryCount + 1);
          }
          throw new Error(`Server error: ${response.status}`);
        }

        throw new Error(
          errorData.error || `Failed to initialize payment (${response.status})`
        );
      }

      const data = JSON.parse(responseText);

      if (!data.success || !data.data) {
        throw new Error(data.error || "Invalid response from payment service");
      }

      return data.data;
    } catch (error) {
      // Retry on network errors
      if (
        retryCount < MAX_RETRIES &&
        (error.name === "TypeError" || error.name === "AbortError")
      ) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return this.initializePayment(registrationData, retryCount + 1);
      }

      throw new Error(
        error.message ||
          "Failed to initialize payment. Please check your connection and try again."
      );
    }
  }

  /**
   * Verify payment with enhanced error handling
   */
  static async verifyPayment(transactionId, retryCount = 0) {
    try {
      if (!transactionId) {
        throw new Error("Transaction ID is required");
      }

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const response = await fetch(
        `${baseUrl}/api/payment/verify?transaction_id=${encodeURIComponent(
          transactionId
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
          signal: AbortSignal.timeout(20000), // 20 second timeout for verification
        }
      );

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          if (retryCount < MAX_RETRIES && response.status >= 500) {
            await delay(RETRY_DELAY * (retryCount + 1));
            return this.verifyPayment(transactionId, retryCount + 1);
          }
          throw new Error(`Verification failed: ${response.status}`);
        }

        throw new Error(errorData.error || "Payment verification failed");
      }

      const data = JSON.parse(responseText);

      if (!data.success || !data.data) {
        throw new Error(data.error || "Invalid verification response");
      }

      return data.data;
    } catch (error) {
      // Retry on network errors
      if (
        retryCount < MAX_RETRIES &&
        (error.name === "TypeError" || error.name === "AbortError")
      ) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return this.verifyPayment(transactionId, retryCount + 1);
      }

      throw new Error(
        error.message ||
          "Failed to verify payment. Please contact support if you were charged."
      );
    }
  }

  /**
   * Check payment status (for polling)
   */
  static async checkPaymentStatus(txRef) {
    try {
      if (!txRef) {
        throw new Error("Transaction reference is required");
      }

      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tx_ref", txRef)
        .single();

      if (error) {
        // Don't throw error if record doesn't exist yet
        if (error.code === "PGRST116") {
          return { status: "pending", data: null };
        }
        throw error;
      }

      return { status: data.status, data };
    } catch (error) {
      console.error("[PaymentService] Status check error:", error);
      return { status: "error", data: null, error: error.message };
    }
  }

  /**
   * Register student after verified payment
   */
  static async registerWithPayment(paymentId, retryCount = 0) {
    try {
      if (!paymentId) {
        throw new Error("Payment ID is required");
      }

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      const response = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ paymentId }),
        signal: AbortSignal.timeout(20000),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          if (retryCount < MAX_RETRIES && response.status >= 500) {
            await delay(RETRY_DELAY * (retryCount + 1));
            return this.registerWithPayment(paymentId, retryCount + 1);
          }
          throw new Error(`Registration failed: ${response.status}`);
        }

        throw new Error(errorData.error || "Registration failed");
      }

      const data = JSON.parse(responseText);

      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }

      return data.data;
    } catch (error) {

      if (
        retryCount < MAX_RETRIES &&
        (error.name === "TypeError" || error.name === "AbortError")
      ) {
        await delay(RETRY_DELAY * (retryCount + 1));
        return this.registerWithPayment(paymentId, retryCount + 1);
      }

      throw new Error(
        error.message || "Registration failed. Please contact support."
      );
    }
  }

  /**
   * Get payment by transaction reference
   */
  static async getPaymentByTxRef(txRef) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("tx_ref", txRef)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[PaymentService] Error fetching payment:", error);
      throw new Error("Payment record not found");
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId) {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("id", paymentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("[PaymentService] Error fetching payment:", error);
      throw new Error("Payment record not found");
    }
  }
}
