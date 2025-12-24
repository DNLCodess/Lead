import { useMutation, useQuery } from "@tanstack/react-query";
import { PaymentService } from "@/lib/services/payment-service";

/**
 * Hook to initialize payment
 */
export function useInitializePayment() {
  return useMutation({
    mutationFn: (registrationData) =>
      PaymentService.initializePayment(registrationData),
    onError: (error) => {
      console.error("Payment initialization failed:", error);
    },
  });
}

/**
 * Hook to verify payment
 */
export function useVerifyPayment() {
  return useMutation({
    mutationFn: (transactionId) => PaymentService.verifyPayment(transactionId),
    onError: (error) => {
      console.error("Payment verification failed:", error);
    },
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
    retry: 1,
  });
}

/**
 * Hook to get payment history
 */
export function usePaymentHistory(email) {
  return useQuery({
    queryKey: ["payment-history", email],
    queryFn: () => PaymentService.getPaymentHistory(email),
    enabled: !!email,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook to cancel payment
 */
export function useCancelPayment() {
  return useMutation({
    mutationFn: (txRef) => PaymentService.cancelPayment(txRef),
  });
}
