import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PaymentService } from "@/lib/services/payment-service";
import { useState } from "react";

/**
 * Hook to initialize payment with enhanced error handling
 */
export function useInitializePayment() {
  const [retryCount, setRetryCount] = useState(0);

  return useMutation({
    mutationFn: (registrationData) => {
      console.log("[useInitializePayment] Starting...");
      return PaymentService.initializePayment(registrationData);
    },
    onError: (error) => {
      console.error("[useInitializePayment] Failed:", error);
      setRetryCount((prev) => prev + 1);
    },
    onSuccess: (data) => {
      console.log("[useInitializePayment] Success:", data);
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
    mutationFn: (transactionId) => {
      console.log("[useVerifyPayment] Verifying:", transactionId);
      return PaymentService.verifyPayment(transactionId);
    },
    onError: (error) => {
      console.error("[useVerifyPayment] Failed:", error);
    },
    onSuccess: (data) => {
      console.log("[useVerifyPayment] Success:", data);
    },
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
        ["successful", "completed", "failed", "cancelled"].includes(data.status)
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
    mutationFn: (paymentId) => {
      console.log("[useRegisterWithPayment] Starting:", paymentId);
      return PaymentService.registerWithPayment(paymentId);
    },
    onError: (error) => {
      console.error("[useRegisterWithPayment] Failed:", error);
    },
    onSuccess: (data) => {
      console.log("[useRegisterWithPayment] Success:", data);
    },
    retry: false,
  });
}
