"use client";

import { useEffect, useState, useCallback } from "react";
import Script from "next/script";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const FLUTTERWAVE_PUBLIC_KEY = process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY;
const POLLING_INTERVAL = 5000; // Check every 5 seconds
const MAX_POLLING_ATTEMPTS = 60; // Stop after 5 minutes (60 * 5s)

export function FlutterwavePayment({
  paymentPayload,
  onSuccess,
  onClose,
  onError,
}) {
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState("initializing"); // initializing, polling, success, failed
  const [statusMessage, setStatusMessage] = useState(
    "Loading payment gateway..."
  );

  // Poll payment status
  const checkPaymentStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/payment/status?tx_ref=${paymentPayload.tx_ref}`
      );
      const data = await response.json();

      if (data.success && data.data) {
        const { status } = data.data;

        if (status === "successful" || status === "completed") {
          setPaymentStatus("success");
          setStatusMessage("Payment confirmed! Redirecting...");
          // Stop polling and trigger success
          setTimeout(() => {
            onSuccess({
              transaction_id: data.data.transaction_id,
              tx_ref: paymentPayload.tx_ref,
              status: status,
            });
          }, 1500);
          return true; // Stop polling
        } else if (status === "failed" || status === "cancelled") {
          setPaymentStatus("failed");
          setStatusMessage("Payment was not completed");
          setTimeout(() => onClose(), 2000);
          return true; // Stop polling
        }
      }

      return false; // Continue polling
    } catch (error) {
      console.error("Error checking payment status:", error);
      return false; // Continue polling
    }
  }, [paymentPayload.tx_ref, onSuccess, onClose]);

  // Start background polling when modal is open
  useEffect(() => {
    if (paymentStatus !== "polling") return;

    const pollInterval = setInterval(async () => {
      setPollingAttempts((prev) => {
        const newCount = prev + 1;

        // Stop after max attempts
        if (newCount >= MAX_POLLING_ATTEMPTS) {
          clearInterval(pollInterval);
          setPaymentStatus("failed");
          setStatusMessage("Payment verification timed out");
          setTimeout(onClose, 2000);
        }

        return newCount;
      });

      const shouldStop = await checkPaymentStatus();
      if (shouldStop) {
        clearInterval(pollInterval);
      }
    }, POLLING_INTERVAL);

    return () => clearInterval(pollInterval);
  }, [paymentStatus, checkPaymentStatus, onClose]);

  const handleScriptLoad = () => {
    console.log("Flutterwave script loaded");

    if (typeof window !== "undefined" && window.FlutterwaveCheckout) {
      initializePayment();
    } else {
      console.error("FlutterwaveCheckout not available");
      setPaymentStatus("failed");
      onError(new Error("Payment gateway failed to load"));
    }
  };

  const initializePayment = () => {
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
          console.log("Payment callback response:", response);

          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            setPaymentStatus("success");
            setStatusMessage("Payment successful! Verifying...");
            onSuccess(response);
          } else {
            setPaymentStatus("failed");
            onError(new Error(`Payment ${response.status}`));
          }
        },
        onclose: function () {
          console.log("Payment modal closed");
          // Start polling in case they completed payment but closed modal
          setPaymentStatus("polling");
          setStatusMessage("Checking payment status...");
        },
      });

      // Start polling immediately as a safety net
      setPaymentStatus("polling");
    } catch (error) {
      console.error("Error initializing payment:", error);
      setPaymentStatus("failed");
      onError(error);
    }
  };

  return (
    <>
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        strategy="afterInteractive"
        onLoad={handleScriptLoad}
        onError={(e) => {
          console.error("Failed to load Flutterwave script:", e);
          setPaymentStatus("failed");
          onError(new Error("Failed to load payment gateway"));
        }}
      />

      {/* Status Overlay - Shows when actively polling */}
      <AnimatePresence>
        {(paymentStatus === "polling" ||
          paymentStatus === "success" ||
          paymentStatus === "failed") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface rounded-2xl border border-[var(--border-color)] p-8 max-w-md w-full"
              style={{ boxShadow: "var(--shadow-xl)" }}
            >
              <div className="flex flex-col items-center text-center space-y-4">
                {paymentStatus === "polling" && (
                  <>
                    <Loader2 className="w-16 h-16 text-[var(--color-green-primary)] animate-spin" />
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      This may take a few moments. Please don't close this
                      window.
                    </p>
                    <div className="w-full bg-[var(--elevated)] rounded-full h-2 overflow-hidden">
                      <motion.div
                        className="h-full bg-[var(--color-green-primary)]"
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{
                          duration:
                            (POLLING_INTERVAL * MAX_POLLING_ATTEMPTS) / 1000,
                          ease: "linear",
                        }}
                      />
                    </div>
                  </>
                )}

                {paymentStatus === "success" && (
                  <>
                    <CheckCircle2 className="w-16 h-16 text-[var(--color-green-primary)]" />
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                  </>
                )}

                {paymentStatus === "failed" && (
                  <>
                    <XCircle className="w-16 h-16 text-red-500" />
                    <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                      {statusMessage}
                    </h3>
                    <button
                      onClick={onClose}
                      className="px-6 py-2 bg-[var(--color-green-primary)] text-white rounded-lg hover:bg-[var(--color-green-hover)] transition-colors"
                    >
                      Close
                    </button>
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
