// app/profile/verify-week-payment/page.jsx (NEW FILE)

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { useVerifyWeekPayment } from "@/hooks/use-week-payment";

export default function VerifyWeekPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");

  const verifyPayment = useVerifyWeekPayment();

  useEffect(() => {
    const transactionId = searchParams.get("transaction_id");
    const txRef = searchParams.get("tx_ref");

    if (!transactionId) {
      setStatus("error");
      setMessage("Missing transaction information");
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPayment.mutateAsync(transactionId);

        if (result.success) {
          setStatus("success");
          setMessage(
            `Successfully unlocked ${result.data.unlockedWeeks.length} week(s)!`
          );

          // Redirect to profile after 3 seconds
          setTimeout(() => {
            router.push("/profile?tab=calendar");
          }, 3000);
        } else {
          throw new Error(result.error || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage(error.message || "Payment verification failed");
      }
    };

    verify();
  }, [searchParams, verifyPayment, router]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "var(--background)" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full p-8 text-center"
        style={{
          background: "var(--color-black-surface)",
          border: "1px solid var(--color-black-border)",
          borderRadius: "1.5rem",
        }}
      >
        {status === "verifying" && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 rounded-full mx-auto mb-4"
              style={{
                border: "4px solid var(--color-black-border)",
                borderTopColor: "#1ed760",
              }}
            />
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Verifying Payment
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>{message}</p>
          </>
        )}

        {status === "success" && (
          <>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(30, 215, 96, 0.2)" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="#1ed760"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#1ed760" }}
            >
              Payment Successful!
            </h2>
            <p style={{ color: "var(--text-secondary)" }}>{message}</p>
            <p className="text-sm mt-4" style={{ color: "var(--text-muted)" }}>
              Redirecting to your profile...
            </p>
          </>
        )}

        {status === "error" && (
          <>
            <div
              className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(239, 68, 68, 0.2)" }}
            >
              <svg
                className="w-8 h-8"
                fill="none"
                stroke="#ef4444"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2
              className="text-2xl font-bold mb-2"
              style={{ color: "#ef4444" }}
            >
              Verification Failed
            </h2>
            <p style={{ color: "var(--text-secondary)" }} className="mb-6">
              {message}
            </p>
            <button
              onClick={() => router.push("/profile")}
              className="px-6 py-3 font-semibold transition-all hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #1ed760, #16b455)",
                color: "#ffffff",
                borderRadius: "0.75rem",
              }}
            >
              Return to Profile
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
}
