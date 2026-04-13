"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Loader2, AlertCircle, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";

const PHASES = [
  { label: "Foundations", range: [1, 13], color: "#3b82f6" },
  { label: "Core Concepts", range: [14, 26], color: "#8b5cf6" },
  { label: "Advanced Practice", range: [27, 39], color: "#f59e0b" },
  { label: "Mastery", range: [40, 52], color: "#1ed760" },
];

function getHighestPhase(weeks) {
  if (!weeks?.length) return null;
  const maxWeek = Math.max(...weeks);
  for (let i = PHASES.length - 1; i >= 0; i--) {
    if (maxWeek >= PHASES[i].range[0]) return PHASES[i];
  }
  return PHASES[0];
}

function useConfettiPieces(active) {
  return useMemo(() => {
    if (!active || typeof window === "undefined") return [];
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      startX: window.innerWidth / 2,
      startY: window.innerHeight / 2,
      endX: Math.random() * window.innerWidth,
      endY: Math.random() * window.innerHeight,
      size: Math.random() * 12 + 5,
      rotate: Math.random() * 360,
      color: ["#1ed760", "#ffd700", "#ff6b6b", "#4ecdc4", "#ff9ff3", "#3b82f6"][
        Math.floor(Math.random() * 6)
      ],
      isCircle: Math.random() > 0.5,
      duration: 1.2 + Math.random() * 0.8,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);
}

export default function VerifyWeekPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState("verifying");
  const [message, setMessage] = useState("Verifying your payment...");
  const [errorDetails, setErrorDetails] = useState(null);
  const [unlockedWeeks, setUnlockedWeeks] = useState([]);
  const confettiPieces = useConfettiPieces(verificationStatus === "success");
  const highestPhase = getHighestPhase(unlockedWeeks);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        const transactionId = searchParams.get("transaction_id");
        const txRef = searchParams.get("tx_ref");
        const status = searchParams.get("status");

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
            {/* Confetti burst (E9) */}
            <div className="fixed inset-0 pointer-events-none z-50">
              {confettiPieces.map((piece) => (
                <motion.div
                  key={piece.id}
                  initial={{ x: piece.startX, y: piece.startY, scale: 0, rotate: 0, opacity: 1 }}
                  animate={{ x: piece.endX, y: piece.endY, scale: [0, 1, 0.8, 0], rotate: piece.rotate, opacity: [1, 1, 0.5, 0] }}
                  transition={{ duration: piece.duration, ease: "easeOut" }}
                  className="absolute"
                  style={{
                    width: piece.size,
                    height: piece.size,
                    background: piece.color,
                    borderRadius: piece.isCircle ? "50%" : "2px",
                  }}
                />
              ))}
            </div>

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, rgba(30,215,96,0.2), rgba(30,215,96,0.1))",
                border: "1px solid rgba(30,215,96,0.3)",
              }}
            >
              <Trophy className="w-10 h-10" style={{ color: "#1ed760" }} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h1 className="text-2xl font-bold mb-1" style={{ color: "#1ed760" }}>
                Weeks Unlocked!
              </h1>
              <p className="mb-5" style={{ color: "var(--text-secondary)" }}>
                {message}
              </p>
            </motion.div>

            {/* Phase milestone (E9) */}
            {highestPhase && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="p-3 rounded-xl mb-4 flex items-center gap-3"
                style={{
                  background: `${highestPhase.color}12`,
                  border: `1px solid ${highestPhase.color}30`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${highestPhase.color}20` }}
                >
                  <CheckCircle2 className="w-4 h-4" style={{ color: highestPhase.color }} />
                </div>
                <div className="text-left">
                  <p className="text-xs font-bold" style={{ color: highestPhase.color }}>
                    {highestPhase.label}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    You&apos;re in this phase
                  </p>
                </div>
              </motion.div>
            )}

            {/* Unlocked weeks */}
            {unlockedWeeks.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="p-4 rounded-xl mb-5"
                style={{
                  background: "var(--elevated)",
                  border: "1px solid var(--color-black-border)",
                }}
              >
                <p className="text-xs font-semibold mb-3 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                  Now Available
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {unlockedWeeks.map((week) => (
                    <span
                      key={week}
                      className="px-3 py-1 rounded-full text-sm font-bold"
                      style={{
                        background: "rgba(30, 215, 96, 0.15)",
                        color: "#1ed760",
                        border: "1px solid rgba(30, 215, 96, 0.3)",
                      }}
                    >
                      Week {week}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Taking you to your calendar...
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
                  background: "#1ed760",
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
