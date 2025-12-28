"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function VerifyWeekPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [errorDetails, setErrorDetails] = useState(null);
  const [unlockedWeeks, setUnlockedWeeks] = useState([]);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get("transaction_id");
        const txRef = searchParams.get("tx_ref");
        const status = searchParams.get("status");

        console.log("Week payment callback received:", {
          transactionId,
          txRef,
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

        // Call verification API directly (no React Query)
        console.log("Starting week payment verification...");

        const response = await fetch(
          `/api/payment/verify/week?transaction_id=${transactionId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
            credentials: "include", // Include auth cookies
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Verification failed");
        }

        const result = await response.json();

        console.log("Verification response:", result);

        if (!result.success) {
          throw new Error(result.error || "Verification failed");
        }

        // Success!
        const weekCount = result.data.unlockedWeeks?.length || 0;
        setUnlockedWeeks(result.data.unlockedWeeks || []);
        setVerificationStatus("success");
        setMessage(
          `Successfully unlocked ${weekCount} week${
            weekCount !== 1 ? "s" : ""
          }!`
        );

        // Redirect to profile calendar after 3 seconds
        setTimeout(() => {
          router.push("/profile?tab=calendar");
        }, 3000);
      } catch (error) {
        console.error("Week payment verification error:", error);
        setVerificationStatus("failed");
        setMessage(
          error.message ||
            "Payment verification failed. Please contact support."
        );
        setErrorDetails(error.toString());
      }
    };

    // Only run once
    verifyPayment();
  }, []); // ✅ Empty dependency array - runs only once on mount

  return (
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      {/* Ambient glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-0 right-0 w-[600px] h-[600px] bg-[var(--color-green-primary)] rounded-full blur-[120px]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full relative z-10"
        style={{
          background: "var(--color-black-surface)",
          border: "1px solid var(--color-black-border)",
          borderRadius: "1.5rem",
          padding: "2rem",
          boxShadow: "var(--shadow-xl)",
        }}
      >
        {/* Verifying State */}
        {verificationStatus === "verifying" && (
          <div className="text-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 mx-auto mb-6"
            >
              <Loader2
                className="w-full h-full"
                style={{ color: "var(--color-green-primary)" }}
              />
            </motion.div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Verifying Payment
            </h1>
            <p style={{ color: "var(--text-secondary)" }}>{message}</p>
          </div>
        )}

        {/* Success State */}
        {verificationStatus === "success" && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(30, 215, 96, 0.2)" }}
            >
              <CheckCircle2
                className="w-10 h-10"
                style={{ color: "var(--color-green-primary)" }}
              />
            </motion.div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--color-green-primary)" }}
            >
              Payment Successful!
            </h1>
            <p className="mb-4" style={{ color: "var(--text-secondary)" }}>
              {message}
            </p>

            {/* Show unlocked weeks */}
            {unlockedWeeks.length > 0 && (
              <div
                className="p-4 rounded-lg mb-4"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                }}
              >
                <p
                  className="text-sm mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Unlocked Weeks:
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {unlockedWeeks.map((week) => (
                    <span
                      key={week}
                      className="px-3 py-1 rounded-full text-sm font-semibold"
                      style={{
                        background: "var(--color-green-primary)",
                        color: "#ffffff",
                      }}
                    >
                      Week {week}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Redirecting to your calendar...
            </p>
          </div>
        )}

        {/* Failed State */}
        {verificationStatus === "failed" && (
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-6 rounded-full flex items-center justify-center"
              style={{ background: "rgba(239, 68, 68, 0.2)" }}
            >
              <XCircle className="w-10 h-10 text-red-500" />
            </motion.div>
            <h1
              className="text-2xl font-bold mb-2"
              style={{ color: "#ef4444" }}
            >
              Verification Failed
            </h1>
            <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
              {message}
            </p>

            {/* Error Details */}
            {errorDetails && (
              <details className="mb-6 text-left">
                <summary
                  className="cursor-pointer text-sm flex items-center gap-2 justify-center"
                  style={{ color: "var(--text-muted)" }}
                >
                  <AlertCircle className="w-4 h-4" />
                  Error Details
                </summary>
                <pre
                  className="mt-2 p-3 rounded text-xs overflow-auto max-h-40 text-left"
                  style={{
                    background: "var(--color-black-elevated)",
                    color: "var(--text-secondary)",
                  }}
                >
                  {errorDetails}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={() => router.push("/profile?tab=calendar")}
                className="w-full text-white font-semibold"
                style={{
                  background: "linear-gradient(135deg, #1ed760, #16b455)",
                }}
              >
                Return to Profile
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="w-full"
                style={{
                  borderColor: "var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
              >
                Try Again
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
