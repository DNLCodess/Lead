import { supabase } from "@/lib/supabase/client";

/**
 * Payment Service for Flutterwave Integration
 */
export class PaymentService {
  /**
   * Initialize payment with Flutterwave (via API route)
   */
  static async initializePayment(registrationData) {
    try {
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
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `HTTP ${response.status}: ${
              errorText || "Failed to initialize payment"
            }`
          );
        }

        throw new Error(errorData.error || "Failed to initialize payment");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to initialize payment");
      }

      return data.data;
    } catch (error) {
      console.error("Payment initialization error:", error);
      throw new Error(
        error.message || "Failed to initialize payment. Please try again."
      );
    }
  }

  /**
   * Verify payment with Flutterwave (via API route)
   * The API route handles both Flutterwave verification AND database update
   */
  static async verifyPayment(transactionId) {
    try {
      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

      console.log("Verifying payment with transaction ID:", transactionId);

      const response = await fetch(
        `${baseUrl}/api/payment/verify?transaction_id=${transactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
          console.error("Verification error details:", errorData);
        } catch {
          throw new Error(
            `HTTP ${response.status}: ${
              errorText || "Payment verification failed"
            }`
          );
        }

        throw new Error(errorData.error || "Payment verification failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Payment verification failed");
      }

      console.log("Payment verification successful:", data.data);

      // Return the data from API (which includes updated payment record)
      return data.data;
    } catch (error) {
      console.error("Payment verification error:", error);
      throw new Error(
        error.message || "Failed to verify payment. Please contact support."
      );
    }
  }

  /**
   * Register student after verified payment (via API route)
   */
  static async registerWithPayment(paymentId) {
    try {
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
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;

        try {
          errorData = JSON.parse(errorText);
        } catch {
          throw new Error(
            `HTTP ${response.status}: ${errorText || "Registration failed"}`
          );
        }

        throw new Error(errorData.error || "Registration failed");
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Registration failed");
      }

      return data.data;
    } catch (error) {
      console.error("Registration error:", error);
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
      console.error("Error fetching payment:", error);
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
      console.error("Error fetching payment:", error);
      throw new Error("Payment record not found");
    }
  }
}
