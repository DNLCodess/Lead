// hooks/use-week-payment.js (NEW FILE)

import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Hook to initialize week payment
 */
export function useInitializeWeekPayment() {
  return useMutation({
    mutationFn: async (paymentData) => {
      const response = await fetch("/api/payment/initialize/week", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to initialize payment");
      }

      return response.json();
    },
    onError: (error) => {
      console.error("Week payment initialization failed:", error);
    },
  });
}

/**
 * Hook to verify week payment and unlock weeks
 */
export function useVerifyWeekPayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (transactionId) => {
      const response = await fetch(
        `/api/payment/verify-week-payment?transaction_id=${transactionId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Payment verification failed");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["unlocked-weeks"]);
      queryClient.invalidateQueries(["user-profile"]);
    },
    onError: (error) => {
      console.error("Week payment verification failed:", error);
    },
  });
}
