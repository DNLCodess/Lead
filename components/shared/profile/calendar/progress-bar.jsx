// app/profile/components/calendar/ProgressBar.jsx

"use client";

import { motion } from "framer-motion";

export default function ProgressBar({
  unlockedWeeks,
  totalWeeks,
  currentWeek,
}) {
  const progress = (unlockedWeeks / totalWeeks) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-xl"
      style={{
        background: "var(--color-black-surface)",
        border: "1px solid var(--color-black-border)",
        borderRadius: "1.2rem",
      }}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3
            className="text-2xl font-bold mb-1"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            Learning Progress
          </h3>
          <p style={{ color: "var(--text-secondary)" }}>
            Week {currentWeek} of 52 • {unlockedWeeks} weeks unlocked
          </p>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: "#1ed760" }}>
              {Math.round(progress)}%
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Complete
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold" style={{ color: "#f59e0b" }}>
              {totalWeeks - unlockedWeeks}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Remaining
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div
          className="h-6 rounded-full overflow-hidden"
          style={{ background: "var(--color-black-border)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full relative"
            style={{
              background: "linear-gradient(90deg, #1ed760, #16b455, #7ee2a8)",
            }}
          >
            {/* Animated Shine Effect */}
            <motion.div
              className="absolute inset-0 opacity-40"
              style={{
                background:
                  "linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)",
              }}
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </motion.div>
        </div>

        {/* Current Week Indicator */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center"
          style={{
            left: `${(currentWeek / totalWeeks) * 100}%`,
            background: "#ffffff",
            border: "3px solid #1ed760",
            transform: "translate(-50%, -50%)",
          }}
        >
          <span className="text-xs">📍</span>
        </motion.div>
      </div>

      {/* Milestones */}
      <div
        className="flex justify-between mt-4 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        <span>Start</span>
        <span>Week 13</span>
        <span>Week 26</span>
        <span>Week 39</span>
        <span>Complete</span>
      </div>
    </motion.div>
  );
}
