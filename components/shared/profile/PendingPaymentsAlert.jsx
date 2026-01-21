// app/profile/components/PendingPaymentsAlert.jsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export default function PendingPaymentsAlert({ userId }) {
  const [retryingPayments, setRetryingPayments] = useState(new Set());
  const queryClient = useQueryClient();

  // Fetch pending payments
  const { data: pendingPayments, isLoading } = useQuery({
    queryKey: ["pending-payments", userId],
    queryFn: async () => {
      const response = await fetch("/api/payment/check-pending");
      if (!response.ok) throw new Error("Failed to check pending payments");
      return response.json();
    },
    refetchInterval: 30000, // Check every 30 seconds
  });

  // Retry verification mutation
  const retryMutation = useMutation({
    mutationFn: async (txRef) => {
      const response = await fetch("/api/payment/retry-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txRef }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Retry failed");
      }

      return response.json();
    },
    onSuccess: (data, txRef) => {
      // Remove from retrying set
      setRetryingPayments((prev) => {
        const next = new Set(prev);
        next.delete(txRef);
        return next;
      });

      // Invalidate queries to refresh data
      queryClient.invalidateQueries(["pending-payments"]);
      queryClient.invalidateQueries(["unlocked-weeks"]);
      queryClient.invalidateQueries(["user-profile"]);
    },
    onError: (error, txRef) => {
      setRetryingPayments((prev) => {
        const next = new Set(prev);
        next.delete(txRef);
        return next;
      });
    },
  });

  const handleRetry = (txRef) => {
    setRetryingPayments((prev) => new Set(prev).add(txRef));
    retryMutation.mutate(txRef);
  };

  if (isLoading || !pendingPayments?.data?.length) {
    return null;
  }

  return (
    <AnimatePresence>
      {pendingPayments.data.map((payment) => {
        const isRetrying = retryingPayments.has(payment.tx_ref);

        return (
          <motion.div
            key={payment.tx_ref}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 p-4 rounded-xl border"
            style={{
              background: "var(--elevated)",
              borderColor: "#f59e0b",
            }}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-1">
                <AlertCircle className="w-5 h-5" style={{ color: "#f59e0b" }} />
              </div>

              <div className="flex-1">
                <h4
                  className="font-semibold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Payment Processing Issue
                </h4>
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Your payment of{" "}
                  <strong>
                    {payment.currency === "NGN" ? "₦" : "$"}
                    {payment.amount.toLocaleString()}
                  </strong>{" "}
                  was successful, but weeks haven't been unlocked yet. This can
                  happen due to network issues.
                </p>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleRetry(payment.tx_ref)}
                    disabled={isRetrying || retryMutation.isPending}
                    className="px-4 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-green-primary), var(--color-green-hover))",
                      color: "#ffffff",
                    }}
                  >
                    {isRetrying ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Retrying...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4" />
                        Retry Unlock
                      </>
                    )}
                  </button>

                  <span
                    className="text-xs"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Ref: {payment.tx_ref.slice(-8)}
                  </span>
                </div>

                {/* Success/Error Messages */}
                <AnimatePresence>
                  {retryMutation.isSuccess &&
                    retryMutation.variables === payment.tx_ref && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 rounded-lg flex items-center gap-2 text-sm"
                        style={{
                          background: "#10b981",
                          color: "#ffffff",
                        }}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Weeks unlocked successfully! Refreshing...
                      </motion.div>
                    )}

                  {retryMutation.isError &&
                    retryMutation.variables === payment.tx_ref && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 p-3 rounded-lg flex items-center gap-2 text-sm"
                        style={{
                          background: "#ef4444",
                          color: "#ffffff",
                        }}
                      >
                        <XCircle className="w-4 h-4" />
                        {retryMutation.error?.message ||
                          "Retry failed. Please contact support."}
                      </motion.div>
                    )}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        );
      })}
    </AnimatePresence>
  );
}
