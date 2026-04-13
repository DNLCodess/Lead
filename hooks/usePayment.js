import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentService } from "@/lib/services/payment-service";
import { useState } from "react";

/**
 * Hook to initialize payment with enhanced error handling
 */
export function useInitializePayment() {
  const [retryCount, setRetryCount] = useState(0);

  return useMutation({
    mutationFn: (registrationData) => PaymentService.initializePayment(registrationData),
    onError: () => {
      setRetryCount((prev) => prev + 1);
    },
    onSuccess: () => {
      setRetryCount(0);
    },
    retry: false, // We handle retries in the service
    meta: { retryCount },
  });
}

/**
 * Hook to verify payment with enhanced error handling
 */
export function useVerifyPayment() {
  return useMutation({
    mutationFn: (transactionId) => PaymentService.verifyPayment(transactionId),
    retry: false,
  });
}

/**
 * Hook to get payment by transaction reference
 */
export function usePayment(txRef) {
  return useQuery({
    queryKey: ["payment", txRef],
    queryFn: () => PaymentService.getPaymentByTxRef(txRef),
    enabled: !!txRef,
    retry: 2,
    retryDelay: 1000,
    staleTime: 0, // Always fetch fresh data
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });
}

/**
 * Hook to poll payment status
 */
export function usePaymentStatus(txRef, enabled = true) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ["payment-status", txRef],
    queryFn: () => PaymentService.checkPaymentStatus(txRef),
    enabled: !!txRef && enabled,
    refetchInterval: (data) => {
      // Stop polling if payment is successful, failed, or cancelled
      if (
        data?.status &&
        ["successful", "failed", "cancelled", "expired"].includes(data.status)
      ) {
        return false;
      }
      // Poll every 3 seconds for pending payments
      return 3000;
    },
    refetchIntervalInBackground: false,
    staleTime: 0,
    gcTime: 1000,
  });
}

/**
 * Hook to register with payment
 */
export function useRegisterWithPayment() {
  return useMutation({
    mutationFn: (paymentId) => PaymentService.registerWithPayment(paymentId),
    retry: false,
  });
}
