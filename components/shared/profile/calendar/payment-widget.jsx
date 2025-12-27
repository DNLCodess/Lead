// app/profile/components/calendar/PaymentWidget.jsx (CORRECTED)

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProfileService } from "@/lib/services/profile-service";
import { useInitializeWeekPayment } from "@/hooks/use-week-payment";
import { useFlutterwave, closePaymentModal } from "flutterwave-react-v3";

const paymentPlans = [
  {
    id: "weekly",
    name: "Weekly",
    icon: "📅",
    popular: false,
  },
  {
    id: "monthly",
    name: "Monthly",
    icon: "📆",
    popular: true,
    badge: "Popular",
  },
  {
    id: "bimonthly",
    name: "Bi-Monthly",
    icon: "🗓️",
    popular: false,
  },
  {
    id: "full",
    name: "Full Year",
    icon: "🎯",
    popular: false,
    badge: "Best Value",
  },
];

export default function PaymentWidget({ profile }) {
  const [selectedPlan, setSelectedPlan] = useState("monthly");
  const [paymentConfig, setPaymentConfig] = useState(null);
  const initializePayment = useInitializeWeekPayment();

  const accountType = profile?.account_type || "nigerian";
  const pricing = ProfileService.getPricing(accountType, selectedPlan);

  // Initialize Flutterwave hook with current config
  const handleFlutterPayment = useFlutterwave(paymentConfig || {});

  const handleUnlock = async () => {
    try {
      const result = await initializePayment.mutateAsync({
        paymentPlan: selectedPlan,
        startWeek: profile?.current_week || 1,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to initialize payment");
      }

      const { paymentPayload } = result.data;

      // Configure Flutterwave
      const config = {
        public_key: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
        tx_ref: paymentPayload.tx_ref,
        amount: paymentPayload.amount,
        currency: paymentPayload.currency,
        payment_options: paymentPayload.payment_options,
        customer: paymentPayload.customer,
        customizations: paymentPayload.customizations,
        meta: paymentPayload.meta,
        callback: (response) => {
          console.log("Payment response:", response);
          closePaymentModal();

          // Redirect to verification page
          if (
            response.status === "successful" ||
            response.status === "completed"
          ) {
            window.location.href = `/profile/verify-week-payment?transaction_id=${response.transaction_id}&tx_ref=${response.tx_ref}`;
          } else {
            alert("Payment was not successful. Please try again.");
          }
        },
        onClose: () => {
          console.log("Payment modal closed");
        },
      };

      // Update config and trigger payment
      setPaymentConfig(config);

      // Small delay to ensure config is set
      setTimeout(() => {
        handleFlutterPayment({
          callback: config.callback,
          onClose: config.onClose,
        });
      }, 100);
    } catch (error) {
      console.error("Payment initialization failed:", error);
      alert(error.message || "Failed to initialize payment");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
      style={{
        background: "var(--color-black-surface)",
        border: "1px solid var(--color-black-border)",
        borderRadius: "1.2rem",
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            Unlock More Weeks
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Choose a payment plan to continue your learning journey
          </p>
        </div>
      </div>

      {/* Payment Plans */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {paymentPlans.map((plan) => {
          const isSelected = selectedPlan === plan.id;
          const planPricing = ProfileService.getPricing(accountType, plan.id);

          return (
            <motion.button
              key={plan.id}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedPlan(plan.id)}
              className="relative p-4 transition-all"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, #1ed760, #16b455)"
                  : "var(--color-black-elevated)",
                border: isSelected
                  ? "2px solid #1ed760"
                  : "1px solid var(--color-black-border)",
                color: isSelected ? "#ffffff" : "var(--text-primary)",
                borderRadius: "1rem",
              }}
            >
              {plan.badge && (
                <div
                  className="absolute -top-2 left-1/2 -translate-x-1/2 px-2 py-1 text-xs font-bold whitespace-nowrap"
                  style={{
                    background: plan.popular ? "#f59e0b" : "#8b5cf6",
                    color: "#ffffff",
                    borderRadius: "9999px",
                  }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="text-2xl mb-2">{plan.icon}</div>
              <div className="font-bold mb-1">{plan.name}</div>
              <div className="text-sm opacity-80">
                {planPricing.weeks} week{planPricing.weeks > 1 ? "s" : ""}
              </div>

              {isSelected && (
                <motion.div
                  layoutId="selectedPlan"
                  className="absolute top-2 right-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Pricing Details */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedPlan}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 mb-6"
          style={{
            background: "var(--color-black-elevated)",
            border: "1px solid var(--color-black-border)",
            borderRadius: "1rem",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div
                className="text-sm mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Total Amount
              </div>
              <div className="text-4xl font-bold" style={{ color: "#1ed760" }}>
                {pricing.currency === "NGN" ? "₦" : "$"}
                {pricing.amount.toLocaleString()}
              </div>
            </div>
            {pricing.discount > 0 && (
              <div
                className="px-4 py-2 text-sm font-bold"
                style={{
                  background: "#f59e0b",
                  color: "#ffffff",
                  borderRadius: "9999px",
                }}
              >
                Save {pricing.discount}%
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div style={{ color: "var(--text-secondary)" }}>
                Weeks Included
              </div>
              <div
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {pricing.weeks} week{pricing.weeks > 1 ? "s" : ""}
              </div>
            </div>
            <div>
              <div style={{ color: "var(--text-secondary)" }}>Per Week</div>
              <div
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {pricing.currency === "NGN" ? "₦" : "$"}
                {pricing.weeklyRate.toLocaleString()}
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Unlock Button */}
      <button
        onClick={handleUnlock}
        disabled={initializePayment.isPending}
        className="w-full py-4 font-bold text-lg transition-all hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: "linear-gradient(135deg, #1ed760, #16b455)",
          color: "#ffffff",
          borderRadius: "1rem",
        }}
      >
        {initializePayment.isPending ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Processing...
          </span>
        ) : (
          `Unlock ${pricing.weeks} Week${pricing.weeks > 1 ? "s" : ""} Now`
        )}
      </button>

      <p
        className="text-center text-sm mt-4"
        style={{ color: "var(--text-muted)" }}
      >
        Secure payment powered by Flutterwave
      </p>
    </motion.div>
  );
}
