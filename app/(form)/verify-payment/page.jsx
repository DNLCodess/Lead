"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { PaymentService } from "@/lib/services/payment-service";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import WelcomeToLead from "@/components/common/welcome";

const POLLING_INTERVAL = 3000; // Check every 3 seconds
const MAX_POLLING_ATTEMPTS = 40; // Stop after 2 minutes (40 * 3s)
const RETRY_DELAY = 2000; // 2 seconds between retries

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [errorDetails, setErrorDetails] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);

  const transactionId = searchParams.get("transaction_id");
  const txRef = searchParams.get("tx_ref");
  const status = searchParams.get("status");

  // Poll payment status from database
  const checkPaymentStatus = useCallback(async () => {
    try {
      if (!txRef) return false;

      const response = await fetch(`/api/payment/status?tx_ref=${txRef}`);
      const data = await response.json();

      if (data.success && data.data) {
        const { status: paymentStatus } = data.data;

        // Payment successful
        if (paymentStatus === "successful") {
          setMessage("Payment confirmed! Creating your account...");
          return true; // Stop polling
        }

        // Payment failed
        if (paymentStatus === "failed" || paymentStatus === "cancelled") {
          setVerificationStatus("failed");
          setMessage("Payment was not completed successfully");
          setErrorDetails(`Payment status: ${paymentStatus}`);
          return true; // Stop polling
        }

        // Still pending - continue polling
        return false;
      }

      return false;
    } catch {
      return false;
    }
  }, [txRef, pollingAttempts]);

  // Main verification and registration flow
  const verifyAndRegister = useCallback(async () => {
    try {
      // Validate required parameters
      if (!transactionId && !txRef) {
        setVerificationStatus("failed");
        setMessage(
          "Invalid payment callback. Missing transaction information."
        );
        setErrorDetails(
          "Transaction ID or reference not provided in callback URL"
        );
        return;
      }

      // Check if payment was cancelled
      if (status === "cancelled") {
        setVerificationStatus("failed");
        setMessage("Payment was cancelled. Please try again.");
        return;
      }

      // First, check if payment was already processed successfully
      if (txRef) {
        try {
          const existingPayment = await PaymentService.getPaymentByTxRef(txRef);

          if (existingPayment?.status === "successful") {
            // Check if user was already created
            if (existingPayment.user_id) {
              setMessage("Payment already verified! Signing you in...");

              // Try to get user data and sign them in
              const { data: userData, error: userError } = await supabase
                .from("students")
                .select("email")
                .eq("id", existingPayment.user_id)
                .single();

              if (!userError && userData) {
                // User already exists, redirect to login
                setVerificationStatus("success");
                setMessage("Account already created. Redirecting to login...");

                setTimeout(() => {
                  window.location.href = `/login?email=${encodeURIComponent(
                    userData.email
                  )}&verified=true`;
                }, 2000);
                return;
              }
            } else {
              // Payment verified but user not created yet - proceed with registration
            }
          }
        } catch {
          // No existing payment found, proceed with verification
        }
      }

      // Step 1: Verify payment with Flutterwave (API route handles DB update)
      setMessage("Verifying payment with payment gateway...");

      const verificationData = await PaymentService.verifyPayment(
        transactionId || txRef
      );

      if (!verificationData.verified) {
        setVerificationStatus("failed");
        setMessage(
          "Payment verification failed. Transaction was not successful."
        );
        setErrorDetails(
          `Transaction status: ${
            verificationData.transactionData?.status || "unknown"
          }`
        );
        return;
      }

      // Step 2: Register user
      setMessage("Payment verified! Creating your account...");

      const registrationResult = await PaymentService.registerWithPayment(
        verificationData.payment.id
      );

      setVerificationStatus("success");
      setMessage("Registration successful! Welcome to LEAD!");

      // Clear localStorage
      localStorage.removeItem("registration_form_data");
      localStorage.removeItem("registration_form_step");

      // Sign in the user if session URL provided
      if (registrationResult.sessionUrl) {
        try {
          const url = new URL(registrationResult.sessionUrl);
          const token = url.searchParams.get("token");
          const type = url.searchParams.get("type");

          if (token && type) {
            const { error } = await supabase.auth.verifyOtp({
              token_hash: token,
              type: type,
            });

            if (!error) {
              // Show welcome screen after successful auth
              setTimeout(() => {
                setShowWelcome(true);
              }, 1500);
              return;
            }
          }
        } catch {
          // Auto sign-in failed, user will log in manually
        }
      }

      // If auto sign-in failed, still show welcome but user will need to log in later
      setTimeout(() => {
        setShowWelcome(true);
      }, 1500);
    } catch (error) {
      // Retry logic for network errors
      if (
        retryCount < 3 &&
        (error.message?.includes("fetch") ||
          error.message?.includes("network") ||
          error.message?.includes("timeout"))
      ) {
        setMessage(`Connection issue. Retrying (${retryCount + 1}/3)...`);

        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          verifyAndRegister();
        }, RETRY_DELAY);
        return;
      }

      // Final error state
      setVerificationStatus("failed");
      setMessage(error.message || "An error occurred. Please contact support.");
      setErrorDetails(error.toString());

      // Show transaction reference for support
      if (txRef) {
        setErrorDetails(
          `${error.toString()}\n\nTransaction Reference: ${txRef}`
        );
      }
    }
  }, [transactionId, txRef, status, searchParams, retryCount]);

  // Start polling when payment is pending
  useEffect(() => {
    if (!isPolling) return;

    const pollInterval = setInterval(async () => {
      setPollingAttempts((prev) => {
        const newCount = prev + 1;

        // Stop after max attempts
        if (newCount >= MAX_POLLING_ATTEMPTS) {
          clearInterval(pollInterval);
          setIsPolling(false);
          setVerificationStatus("failed");
          setMessage(
            "Payment verification timed out. Please check your payment status."
          );
          setErrorDetails(
            "The payment verification took too long. If payment was successful, it will be processed. Please contact support if you need assistance."
          );
          return newCount;
        }

        return newCount;
      });

      const paymentConfirmed = await checkPaymentStatus();

      if (paymentConfirmed) {
        clearInterval(pollInterval);
        setIsPolling(false);
        // Continue with verification flow
        verifyAndRegister();
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [isPolling, checkPaymentStatus, verifyAndRegister]);

  // Initial verification on mount
  useEffect(() => {
    const initialize = async () => {
      // If status is successful, proceed directly
      if (status === "successful") {
        await verifyAndRegister();
      } else if (txRef) {
        // Otherwise, start polling for status updates
        setMessage("Checking payment status...");
        setIsPolling(true);
      } else {
        setVerificationStatus("failed");
        setMessage("Invalid payment reference");
      }
    };

    initialize();
  }, []); // Only run once on mount

  // Show welcome component after successful registration
  if (showWelcome) {
    return <WelcomeToLead />;
  }

  // Show verification status
  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-surface rounded-2xl border border-[var(--border-color)] p-8 text-center"
        style={{ boxShadow: "var(--shadow-xl)" }}
      >
        <AnimatePresence mode="wait">
          {verificationStatus === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--color-green-primary)] animate-spin" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                {isPolling ? "Checking Payment Status" : "Verifying Payment"}
              </h1>
              <p className="text-[var(--text-secondary)] mb-4">{message}</p>

              {isPolling && (
                <>
                  <div className="flex items-center justify-center gap-2 text-sm text-[var(--text-muted)] mb-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>
                      Polling attempt {pollingAttempts + 1}/
                      {MAX_POLLING_ATTEMPTS}
                    </span>
                  </div>
                  <div className="w-full bg-[var(--elevated)] rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-[var(--color-green-primary)]"
                      initial={{ width: "0%" }}
                      animate={{
                        width: `${
                          (pollingAttempts / MAX_POLLING_ATTEMPTS) * 100
                        }%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-3">
                    This may take a few moments. Please don't close this window.
                  </p>
                </>
              )}

              {retryCount > 0 && (
                <div className="mt-4 p-3 bg-[var(--accent-bg)] border border-[var(--color-green-primary)]/20 rounded-lg">
                  <p className="text-sm text-[var(--text-secondary)]">
                    Connection retry {retryCount}/3
                  </p>
                </div>
              )}
            </motion.div>
          )}

          {verificationStatus === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
              >
                <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[var(--color-green-primary)]" />
              </motion.div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Payment Successful!
              </h1>
              <p className="text-[var(--text-secondary)]">{message}</p>
            </motion.div>
          )}

          {verificationStatus === "failed" && (
            <motion.div
              key="failed"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
            >
              <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
              <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
                Verification Issue
              </h1>
              <p className="text-[var(--text-secondary)] mb-4">{message}</p>

              {errorDetails && (
                <details className="mb-6 text-left">
                  <summary className="cursor-pointer text-sm text-[var(--text-muted)] flex items-center gap-2 justify-center hover:text-[var(--text-primary)] transition-colors">
                    <AlertCircle className="w-4 h-4" />
                    View Error Details
                  </summary>
                  <motion.pre
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="mt-3 p-4 bg-[var(--elevated)] rounded-lg text-xs overflow-auto max-h-48 text-left border border-[var(--border-color)]"
                  >
                    {errorDetails}
                  </motion.pre>
                </details>
              )}

              {txRef && (
                <div className="mb-6 p-4 bg-[var(--elevated)] rounded-lg border border-[var(--border-color)]">
                  <p className="text-xs text-[var(--text-muted)] mb-2">
                    Transaction Reference
                  </p>
                  <p className="font-mono text-sm text-[var(--text-primary)] break-all">
                    {txRef}
                  </p>
                  <p className="text-xs text-[var(--text-muted)] mt-2">
                    Please save this reference for support inquiries
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <Button
                  onClick={() => (window.location.href = "/registration-form")}
                  className="w-full bg-[var(--color-green-primary)] hover:bg-[var(--color-green-hover)] text-white"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => (window.location.href = "/support")}
                  variant="outline"
                  className="w-full border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--elevated)]"
                >
                  Contact Support
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
