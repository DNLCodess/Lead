"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Script from "next/script";
import { Loader2, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const POLLING_INTERVAL = 3000; // Reduced to 3s for faster detection
const MAX_POLLING_ATTEMPTS = 100; // Extended to 5 minutes (100 * 3s)
const CALLBACK_TIMEOUT = 10000; // Wait 10s after modal close for callback

export function FlutterwavePayment({
  paymentPayload,
  onSuccess,
  onClose,
  onError,
}) {
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("initializing");
  const [statusMessage, setStatusMessage] = useState(
    "Loading payment gateway..."
  );
  const [canRetry, setCanRetry] = useState(false);

  // Track if callback has been received
  const callbackReceivedRef = useRef(false);
  const modalClosedTimeRef = useRef(null);
  const pollingIntervalRef = useRef(null);

  // Improved payment status check with exponential backoff
  const checkPaymentStatus = useCallback(
    async (attempt = 0) => {
      try {
        const response = await fetch(
          `/api/payment/status?tx_ref=${paymentPayload.tx_ref}`,
          {
            method: "GET",
            headers: {
              "Cache-Control": "no-cache",
              Pragma: "no-cache",
            },
          }
        );

        if (!response.ok) {
          return false;
        }

        const data = await response.json();

        if (data.success && data.data) {
          const { status, transaction_id } = data.data;

          if (status === "successful") {
            callbackReceivedRef.current = true;
            setPaymentStatus("success");
            setStatusMessage("Payment confirmed! Setting up your account...");

            // Clear any existing polling
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            // Slight delay for UX
            setTimeout(() => {
              onSuccess({
                transaction_id: transaction_id || data.data.flw_transaction_id,
                tx_ref: paymentPayload.tx_ref,
                status: status,
              });
            }, 1500);
            return true;
          }

          if (status === "failed" || status === "cancelled") {
            setPaymentStatus("failed");
            setStatusMessage(`Payment ${status}. Please try again.`);
            setCanRetry(true);

            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
            return true;
          }

          return false;
        }

        return false;
      } catch {
        return false;
      }
    },
    [paymentPayload.tx_ref, onSuccess]
  );

  // Start polling with proper cleanup
  const startPolling = useCallback(() => {
    // Clear any existing interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }

    setPaymentStatus("polling");
    setStatusMessage("Verifying your payment...");
    setPollingAttempts(0);

    // Immediate check
    checkPaymentStatus(0);

    // Set up polling interval
    pollingIntervalRef.current = setInterval(async () => {
      setPollingAttempts((prev) => {
        const newCount = prev + 1;

        if (newCount >= MAX_POLLING_ATTEMPTS) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;

          setPaymentStatus("timeout");
          setStatusMessage(
            "Payment verification timed out. Don't worry - if you paid, we'll process it."
          );
          setCanRetry(true);
        }

        return newCount;
      });

      const shouldStop = await checkPaymentStatus(pollingAttempts + 1);
      if (shouldStop && pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }, POLLING_INTERVAL);
  }, [checkPaymentStatus, pollingAttempts]);

  // Initialize Flutterwave payment
  const initializePayment = useCallback(() => {
    try {
      window.FlutterwaveCheckout({
        public_key: FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: paymentPayload.tx_ref,
        amount: paymentPayload.amount,
        currency: paymentPayload.currency,
        payment_options: paymentPayload.payment_options,
        redirect_url: paymentPayload.redirect_url,
        customer: paymentPayload.customer,
        customizations: paymentPayload.customizations,
        meta: paymentPayload.meta,

        callback: function (response) {
          callbackReceivedRef.current = true;

          if (response.status === "successful") {
            setPaymentStatus("success");
            setStatusMessage("Payment successful! Setting up your account...");

            // Clear polling if active
            if (pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }

            setTimeout(() => {
              onSuccess({
                transaction_id: response.transaction_id,
                tx_ref: response.tx_ref,
                status: response.status,
              });
            }, 1500);
          } else {
            setPaymentStatus("failed");
            setStatusMessage(`Payment ${response.status}`);
            setCanRetry(true);
            onError(new Error(`Payment ${response.status}`));
          }
        },

        onclose: function () {
          modalClosedTimeRef.current = Date.now();

          if (callbackReceivedRef.current) {
            return;
          }

          // Wait for potential late callback
          setTimeout(() => {
            if (!callbackReceivedRef.current) {
              startPolling();
            }
          }, 2000); // 2s grace period for slow callbacks
        },
      });
    } catch (error) {
      console.error("[Flutterwave] Initialization error:", error);
      setPaymentStatus("failed");
      setStatusMessage("Failed to load payment gateway");
      setCanRetry(true);
      onError(error);
    }
  }, [paymentPayload, onSuccess, onError, startPolling]);

  // Handle script load
  const handleScriptLoad = () => {
    if (typeof window !== "undefined" && window.FlutterwaveCheckout) {
      initializePayment();
    } else {
      setPaymentStatus("failed");
      setStatusMessage("Payment gateway failed to load");
      setCanRetry(true);
      onError(new Error("Payment gateway failed to load"));
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, []);

  // Handle retry
  const handleRetry = () => {
    setCanRetry(false);
    setPaymentStatus("initializing");
    setStatusMessage("Retrying payment...");
    callbackReceivedRef.current = false;
    modalClosedTimeRef.current = null;
    setPollingAttempts(0);

    // Reinitialize after brief delay
    setTimeout(() => {
      if (window.FlutterwaveCheckout) {
        initializePayment();
      } else {
        setPaymentStatus("failed");
        setStatusMessage("Please refresh the page and try again");
        setCanRetry(true);
      }
    }, 500);
  };

  return (
    <>
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={() => {
          setPaymentStatus("failed");
          setStatusMessage("Failed to load payment gateway");
          setCanRetry(true);
          onError(new Error("Failed to load payment gateway"));
        }}
      />

      {/* Status Overlay */}
      <AnimatePresence>
        {(paymentStatus === "polling" ||
          paymentStatus === "success" ||
          paymentStatus === "failed" ||
          paymentStatus === "timeout") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => e.stopPropagation()} // Prevent accidental clicks
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-2xl border border-[var(--border-color)] p-8 max-w-md w-full"
              style={{ boxShadow: "var(--shadow-xl)" }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {/* Polling State */}
                {paymentStatus === "polling" && (
                  <>
                    <div className="relative">
                      <Loader2 className="w-16 h-16 text-[var(--color-green-primary)] animate-spin" />
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            "0 0 0 0 rgba(30, 215, 96, 0.4)",
                            "0 0 0 20px rgba(30, 215, 96, 0)",
                          ],
                        }}
                        transition={{
                          duration: 1.5,
                          repeat: Infinity,
                        }}
                      />
                    </div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      Please wait while we confirm your payment. This usually
                      takes a few seconds.
                    </p>
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
                    <p className="text-xs text-[var(--text-muted)]">
                      Attempt {pollingAttempts} of {MAX_POLLING_ATTEMPTS}
                    </p>
                  </>
                )}

                {/* Success State */}
                {paymentStatus === "success" && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      <CheckCircle2 className="w-16 h-16 text-[var(--color-green-primary)]" />
                    </motion.div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      You'll be redirected shortly...
                    </p>
                  </>
                )}

                {/* Failed State */}
                {(paymentStatus === "failed" ||
                  paymentStatus === "timeout") && (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                    >
                      {paymentStatus === "timeout" ? (
                        <AlertTriangle className="w-16 h-16 text-yellow-500" />
                      ) : (
                        <XCircle className="w-16 h-16 text-red-500" />
                      )}
                    </motion.div>
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {paymentStatus === "timeout"
                        ? "If you completed payment, check your email for confirmation or contact support with reference: " +
                          paymentPayload.tx_ref.substring(0, 12)
                        : "Don't worry, no charges were made to your account."}
                    </p>
                    <div className="flex gap-3 w-full">
                      {canRetry && (
                        <Button
                          onClick={handleRetry}
                          className="flex-1 bg-[var(--color-green-primary)] text-white hover:bg-[var(--color-green-hover)]"
                        >
                          Try Again
                        </Button>
                      )}
                      <Button
                        onClick={onClose}
                        variant="outline"
                        className="flex-1 border-[var(--border-color)] text-[var(--text-primary)]"
                      >
                        Close
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
