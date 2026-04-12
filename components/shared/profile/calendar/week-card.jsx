// components/shared/profile/calendar/WeekCard.jsx

"use client";

import { motion } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";
import { Check, Lock, Zap, Clock } from "lucide-react";

export default function WeekCard({ weekNumber, isUnlocked, isCurrent, isUpcoming, title }) {
  const { setSelectedWeek } = useProfileStore();

  const getState = () => {
    if (isCurrent) return "current";
    if (isUnlocked) return "unlocked";
    if (isUpcoming) return "upcoming";
    return "locked";
  };

  const state = getState();

  const stateStyles = {
    current: {
      background: "linear-gradient(135deg, #1ed760, #17c255)",
      border: "1.5px solid #1ed760",
      color: "#062010",
      shadow: "0 4px 16px rgba(30, 215, 96, 0.35)",
      titleColor: "#062010",
      numColor: "#062010",
    },
    unlocked: {
      background: "#142b1c",
      border: "1px solid rgba(30, 215, 96, 0.35)",
      color: "#7ee2a8",
      shadow: "none",
      titleColor: "#7ee2a8",
      numColor: "#1ed760",
    },
    upcoming: {
      // Visually distinct from locked: slightly warmer tint + amber border
      background: "rgba(245, 158, 11, 0.06)",
      border: "1px solid rgba(245, 158, 11, 0.3)",
      color: "#f59e0b",
      shadow: "none",
      titleColor: "var(--text-muted)",
      numColor: "#f59e0b",
    },
    locked: {
      background: "var(--elevated)",
      border: "1px solid var(--color-black-border)",
      color: "var(--text-muted)",
      shadow: "none",
      titleColor: "var(--text-muted)",
      numColor: "var(--text-muted)",
    },
  };

  const StateIcon = {
    current: Zap,
    unlocked: Check,
    upcoming: Clock,
    locked: Lock,
  }[state];

  const styles = stateStyles[state];

  return (
    <motion.button
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedWeek(weekNumber)}
      className="relative rounded-xl font-bold transition-all text-left p-2.5 flex flex-col gap-1"
      style={{
        background: styles.background,
        border: styles.border,
        boxShadow: styles.shadow,
        minHeight: "64px",
      }}
      aria-label={`Week ${weekNumber}${title ? ` — ${title}` : ""} (${state})`}
    >
      {/* Week number + icon row */}
      <div className="flex items-center justify-between">
        <span
          className="text-xs font-bold leading-none"
          style={{ color: styles.numColor }}
        >
          W{weekNumber}
        </span>
        <StateIcon
          className="w-3 h-3 shrink-0"
          strokeWidth={state === "current" ? 2.5 : 2}
          style={{ color: styles.color }}
          aria-hidden="true"
        />
      </div>

      {/* Title (truncated to 2 lines) */}
      {title && (
        <p
          className="text-[10px] leading-tight line-clamp-2 font-medium"
          style={{ color: styles.titleColor, opacity: state === "locked" ? 0.6 : 1 }}
        >
          {title}
        </p>
      )}

      {/* Pulse ring on current week */}
      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{ border: "1.5px solid #1ed760" }}
          animate={{ opacity: [0.6, 0, 0.6], scale: [1, 1.1, 1] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}
