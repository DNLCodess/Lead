"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Target,
  CheckCircle2,
  Loader2,
  Shield,
  Clock,
  RefreshCw,
  X,
} from "lucide-react";
import { ProfileService } from "@/lib/services/profile-service";
import { useInitializeWeekPayment } from "@/hooks/use-week-payment";
import Script from "next/script";

const LS_TX_REF    = "lead_ptx_ref";
const LS_AMOUNT    = "lead_ptx_amount";
const LS_CURRENCY  = "lead_ptx_currency";
const LS_STARTED   = "lead_ptx_started";

const paymentPlans = [
  { id: "weekly",   name: "Weekly",    icon: Calendar,      popular: false },
  { id: "monthly",  name: "Monthly",   icon: CalendarDays,  popular: true,  badge: "Popular"    },
  { id: "bimonthly",name: "Bi-Monthly",icon: CalendarRange, popular: false },
  { id: "full",     name: "Full Year", icon: Target,        popular: false, badge: "Best Value" },
];

export default function PaymentWidget({ profile }) {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [isFlutterwaveLoaded, setIsFlutterwaveLoaded] = useState(false);
  const [inlineError, setInlineError] = useState(null);
  const [pendingTransfer, setPendingTransfer] = useState(null);

  const initializePayment = useInitializeWeekPayment();
  const accountType = profile?.account_type || "nigerian";
  const pricing = ProfileService.getPricing(accountType, selectedPlan);

  // ── Detect Flutterwave on mount (cached) and poll as fallback ──────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded (e.g. previous navigation)
    if (typeof window.FlutterwaveCheckout === "function") {
      setIsFlutterwaveLoaded(true);
      return;
    }

    // Fallback: poll until the global is available (covers onLoad timing edge cases)
    const interval = setInterval(() => {
      if (typeof window.FlutterwaveCheckout === "function") {
        setIsFlutterwaveLoaded(true);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  // ── Restore pending bank transfer from localStorage on mount ──────────────
  useEffect(() => {
    const txRef = localStorage.getItem(LS_TX_REF);
    if (!txRef) return;

    const startedAt = localStorage.getItem(LS_STARTED);
    const expiresIn = 24 * 60 * 60 * 1000; // 24 h
    if (startedAt && Date.now() - new Date(startedAt).getTime() > expiresIn) {
      clearPendingTransfer();
      return;
    }

    setPendingTransfer({
      txRef,
      amount:    localStorage.getItem(LS_AMOUNT),
      currency:  localStorage.getItem(LS_CURRENCY),
      startedAt,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearPendingTransfer = useCallback(() => {
    localStorage.removeItem(LS_TX_REF);
    localStorage.removeItem(LS_AMOUNT);
    localStorage.removeItem(LS_CURRENCY);
    localStorage.removeItem(LS_STARTED);
    setPendingTransfer(null);
  }, []);

  // ── Poll /api/payment/status while a transfer is in flight ────────────────
  useEffect(() => {
    if (!pendingTransfer) return;

    let cancelled = false;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res  = await fetch(`/api/payment/status?tx_ref=${pendingTransfer.txRef}`);
        const body = await res.json();
        const status = body.data?.status;

        if (status === "successful") {
          clearPendingTransfer();
          window.location.href = `/profile/verify-week-payment?transaction_id=${body.data.transaction_id}&tx_ref=${pendingTransfer.txRef}`;
        } else if (["failed", "cancelled", "expired"].includes(status)) {
          clearPendingTransfer();
        }
      } catch (_) {
        // Network error — keep polling
      }
    };

    poll(); // immediate first check
    const interval = setInterval(poll, 10_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [pendingTransfer, clearPendingTransfer]);

  // ── Launch Flutterwave checkout ───────────────────────────────────────────
  const handleUnlock = async () => {
    setInlineError(null);

    if (!isFlutterwaveLoaded) {
      setInlineError("Payment system is still loading. Please try again in a moment.");
      return;
    }

    try {
      const result = await initializePayment.mutateAsync({
        paymentPlan: selectedPlan,
        startWeek:   profile?.current_week || 1,
      });

      if (!result.success) throw new Error(result.error || "Failed to initialize payment");

      const { paymentPayload, txRef } = result.data;

      window.FlutterwaveCheckout({
        public_key:      process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref:          txRef,
        amount:          paymentPayload.amount,
        currency:        paymentPayload.currency,
        payment_options: paymentPayload.payment_options,
        customer:        paymentPayload.customer,
        customizations:  paymentPayload.customizations,
        meta:            paymentPayload.meta,
        callback: (response) => {
          // Payment completed in-modal — clear any stale pending state
          clearPendingTransfer();
          if (response.status === "successful" || response.status === "completed") {
            window.location.href = `/profile/verify-week-payment?transaction_id=${response.transaction_id}&tx_ref=${response.tx_ref}`;
          } else {
            setInlineError("Payment was not completed. Please try again.");
          }
        },
        onclose: () => {
          // User closed the modal — they may have copied the bank account number
          // and left to transfer in their banking app. Persist state so we can
          // show the pending UI and poll automatically when they return.
          localStorage.setItem(LS_TX_REF,   txRef);
          localStorage.setItem(LS_AMOUNT,   String(paymentPayload.amount));
          localStorage.setItem(LS_CURRENCY, paymentPayload.currency);
          localStorage.setItem(LS_STARTED,  new Date().toISOString());
          setPendingTransfer({
            txRef,
            amount:   String(paymentPayload.amount),
            currency: paymentPayload.currency,
            startedAt: new Date().toISOString(),
          });
        },
      });
    } catch (error) {
      setInlineError(error.message || "Failed to initialize payment. Please try again.");
    }
  };

  // ── Pending bank-transfer UI ──────────────────────────────────────────────
  if (pendingTransfer) {
    const symbol  = pendingTransfer.currency === "NGN" ? "₦" : "$";
    const display = pendingTransfer.amount
      ? Number(pendingTransfer.amount).toLocaleString()
      : "";

    return (
      <>
        <Script
          src="https://checkout.flutterwave.com/v3.js"
          strategy="afterInteractive"
          onLoad={() => setIsFlutterwaveLoaded(true)}
        />
        <motion.div
          id="payment-widget"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-6"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: "rgba(245,158,11,0.15)",
                  border: "1px solid rgba(245,158,11,0.3)",
                }}
              >
                <Clock className="w-5 h-5" style={{ color: "#f59e0b" }} />
              </div>
              <div>
                <h3
                  className="font-bold"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-satoshi)" }}
                >
                  Transfer Pending
                </h3>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  Waiting for your bank transfer
                </p>
              </div>
            </div>
            <button
              onClick={clearPendingTransfer}
              className="p-1.5 rounded-lg transition-colors hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Amount */}
          <div
            className="p-4 rounded-xl mb-5"
            style={{
              background: "rgba(245,158,11,0.08)",
              border:     "1px solid rgba(245,158,11,0.2)",
            }}
          >
            <p className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
              Expected amount
            </p>
            <p className="text-2xl font-bold" style={{ color: "#f59e0b" }}>
              {symbol}{display}
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-2.5 text-sm mb-5" style={{ color: "var(--text-secondary)" }}>
            {[
              "Complete the transfer in your banking app if you haven't already.",
              "Your weeks will unlock automatically once the bank confirms the transfer.",
              "Bank transfers can take a few minutes. This page checks automatically.",
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{ background: "#f59e0b" }}
                />
                <p>{text}</p>
              </div>
            ))}
          </div>

          {/* Polling indicator */}
          <div
            className="flex items-center gap-2 mb-5 text-sm"
            style={{ color: "var(--text-muted)" }}
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Checking transfer status automatically...</span>
          </div>

          {/* Dismiss / start over */}
          <button
            onClick={clearPendingTransfer}
            className="w-full py-3 rounded-xl text-sm font-medium transition-all hover:opacity-80"
            style={{
              border:     "1px solid var(--border-color)",
              color:      "var(--text-secondary)",
              background: "transparent",
            }}
          >
            I didn&apos;t make the transfer — start over
          </button>

          <div className="flex items-center justify-center gap-2 mt-4">
            <Shield className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Secure payment powered by Flutterwave
            </p>
          </div>
        </motion.div>
      </>
    );
  }

  // ── Normal payment widget ─────────────────────────────────────────────────
  return (
    <>
      <Script
        src="https://checkout.flutterwave.com/v3.js"
        strategy="afterInteractive"
        onLoad={() => setIsFlutterwaveLoaded(true)}
        onError={() => setInlineError("Failed to load payment system. Please refresh the page.")}
      />

      <motion.div
        id="payment-widget"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3
              className="text-2xl font-bold mb-1"
              style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
            >
              Unlock More Weeks
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Choose a payment plan to continue your learning journey
            </p>
          </div>
        </div>

        {/* Plan selector */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 pt-3"
          style={{ overflow: "visible" }}
        >
          {paymentPlans.map((plan) => {
            const isSelected   = selectedPlan === plan.id;
            const planPricing  = ProfileService.getPricing(accountType, plan.id);
            const IconComponent = plan.icon;

            return (
              <motion.button
                key={plan.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedPlan(plan.id)}
                className="relative p-4 transition-all rounded-2xl"
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #1a3a22, #1d3324)"
                    : "var(--elevated)",
                  border: isSelected
                    ? "1.5px solid var(--color-green-primary)"
                    : "1px solid var(--border-color)",
                  color: isSelected ? "#1ed760" : "var(--text-primary)",
                  boxShadow: isSelected
                    ? "inset 0 1px 0 rgba(30,215,96,0.15), 0 0 16px rgba(30,215,96,0.12)"
                    : "none",
                  overflow: "visible",
                }}
              >
                {plan.badge && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 text-[10px] font-bold leading-5 z-10"
                    style={{
                      background:    plan.popular ? "#f59e0b" : "#8b5cf6",
                      color:         "#ffffff",
                      borderRadius:  "9999px",
                      whiteSpace:    "nowrap",
                      maxWidth:      "calc(100% + 16px)",
                      textOverflow:  "ellipsis",
                      overflow:      "hidden",
                    }}
                  >
                    {plan.badge}
                  </div>
                )}

                <div className="flex justify-center mb-2">
                  <IconComponent className="w-7 h-7" strokeWidth={2} />
                </div>
                <div className="font-bold mb-1">{plan.name}</div>
                <div className="text-sm opacity-80">
                  {planPricing.weeks} week{planPricing.weeks > 1 ? "s" : ""}
                </div>

                {isSelected && (
                  <motion.div layoutId="selectedPlan" className="absolute top-2 right-2">
                    <CheckCircle2 className="w-5 h-5" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Pricing summary */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedPlan}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-elevated p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-sm mb-1" style={{ color: "var(--text-secondary)" }}>
                  Total Amount
                </div>
                <div className="text-4xl font-bold" style={{ color: "var(--color-green-primary)" }}>
                  {pricing.currency === "NGN" ? "₦" : "$"}
                  {pricing.amount.toLocaleString()}
                </div>
              </div>
              {pricing.discount > 0 && (
                <div
                  className="px-4 py-2 text-sm font-bold"
                  style={{ background: "#f59e0b", color: "#ffffff", borderRadius: "9999px" }}
                >
                  Save {pricing.discount}%
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Weeks Included</div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {pricing.weeks} week{pricing.weeks > 1 ? "s" : ""}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-secondary)" }}>Per Week</div>
                <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                  {pricing.currency === "NGN" ? "₦" : "$"}
                  {pricing.weeklyRate.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Unlock button */}
        <button
          onClick={handleUnlock}
          disabled={initializePayment.isPending || !isFlutterwaveLoaded}
          className="w-full py-4 rounded-2xl font-bold text-lg transition-all hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{
            background:  "linear-gradient(135deg, var(--color-green-primary), var(--color-green-hover))",
            color:       "#0a0d12",
            boxShadow:   "0 4px 16px rgba(30, 215, 96, 0.3)",
          }}
        >
          {!isFlutterwaveLoaded ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Loading payment system...
            </span>
          ) : initializePayment.isPending ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="animate-spin h-5 w-5" />
              Processing...
            </span>
          ) : (
            `Unlock ${pricing.weeks} Week${pricing.weeks > 1 ? "s" : ""} Now`
          )}
        </button>

        {/* Error */}
        {(inlineError || initializePayment.isError) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
            role="alert"
          >
            <svg
              className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-500">
              {inlineError || initializePayment.error?.message || "Payment initialization failed"}
            </p>
          </motion.div>
        )}

        <div className="flex items-center justify-center gap-2 mt-4">
          <Shield className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          <p className="text-center text-sm" style={{ color: "var(--text-muted)" }}>
            Secure payment powered by Flutterwave
          </p>
        </div>
      </motion.div>
    </>
  );
}
