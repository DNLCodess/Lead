"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { PaymentService } from "@/lib/services/payment-service";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase/client";
import WelcomeToLead from "@/components/common/welcome";

export default function VerifyPaymentPage() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [errorDetails, setErrorDetails] = useState(null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const verifyAndRegister = async () => {
      try {
        const transactionId = searchParams.get("transaction_id");
        const status = searchParams.get("status");

        console.log("Payment callback received:", {
          transactionId,
          status,
          allParams: Object.fromEntries(searchParams.entries()),
        });

        // Validate required parameters
        if (!transactionId) {
          setVerificationStatus("failed");
          setMessage(
            "Invalid payment callback. Missing transaction information."
          );
          setErrorDetails("Transaction ID not provided in callback URL");
          return;
        }

        // Check status from callback
        if (status === "cancelled") {
          setVerificationStatus("failed");
          setMessage("Payment was cancelled. Please try again.");
          return;
        }

        // Step 1: Verify payment (API route handles DB update)
        console.log("Starting payment verification...");
        const verificationData = await PaymentService.verifyPayment(
          transactionId
        );

        console.log("Verification response:", verificationData);

        if (!verificationData.verified) {
          setVerificationStatus("failed");
          setMessage(
            "Payment verification failed. Transaction was not successful."
          );
          setErrorDetails(
            `Transaction status: ${verificationData.transactionData?.status}`
          );
          return;
        }

        // Step 2: Register user
        setMessage("Payment verified! Creating your account...");
        console.log(
          "Starting registration with payment ID:",
          verificationData.payment.id
        );

        const registrationResult = await PaymentService.registerWithPayment(
          verificationData.payment.id
        );

        console.log("Registration result:", registrationResult);

        setVerificationStatus("success");
        setMessage("Registration successful! Redirecting...");

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
                }, 2000);
                return;
              }
            }
          } catch (authError) {
            console.error("Auto sign-in failed:", authError);
          }
        }

        // If auto sign-in failed, still show welcome but user will need to log in later
        setTimeout(() => {
          setShowWelcome(true);
        }, 2000);
      } catch (error) {
        console.error("Verification/Registration error:", error);
        setVerificationStatus("failed");
        setMessage(
          error.message || "An error occurred. Please contact support."
        );
        setErrorDetails(error.toString());
      }
    };

    verifyAndRegister();
  }, [searchParams]);

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
        {verificationStatus === "verifying" && (
          <>
            <Loader2 className="w-16 h-16 mx-auto mb-4 text-[var(--color-green-primary)] animate-spin" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Verifying Payment
            </h1>
          </>
        )}

        {verificationStatus === "success" && (
          <>
            <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-[var(--color-green-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Payment Successful!
            </h1>
          </>
        )}

        {verificationStatus === "failed" && (
          <>
            <XCircle className="w-16 h-16 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
              Payment Failed
            </h1>
          </>
        )}

        <p className="text-[var(--text-secondary)] mb-6">{message}</p>

        {errorDetails && (
          <details className="mb-4 text-left">
            <summary className="cursor-pointer text-sm text-[var(--text-muted)] flex items-center gap-2 justify-center">
              <AlertCircle className="w-4 h-4" />
              Error Details
            </summary>
            <pre className="mt-2 p-3 bg-[var(--elevated)] rounded text-xs overflow-auto max-h-40 text-left">
              {errorDetails}
            </pre>
          </details>
        )}

        {verificationStatus === "failed" && (
          <div className="space-y-3">
            <Button
              onClick={() => (window.location.href = "/registration-form")}
              className="w-full bg-[var(--color-green-primary)] hover:bg-[var(--color-green-hover)] text-white"
            >
              Try Again
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
