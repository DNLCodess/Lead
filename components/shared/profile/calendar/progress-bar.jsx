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
      className="card p-6"
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

      {/* Progress Bar + Tick Marks */}
      <div className="relative">
        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ background: "var(--elevated)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="h-full relative"
            style={{
              background: "linear-gradient(90deg, #1ed760, #16b455)",
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
          className="absolute w-6 h-6 rounded-full flex items-center justify-center"
          style={{
            left: `${(currentWeek / totalWeeks) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            background: "#ffffff",
            border: "3px solid #1ed760",
            boxShadow: "0 0 12px rgba(30, 215, 96, 0.5)",
          }}
        >
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: "#1ed760" }}
          />
        </motion.div>

        {/* Tick marks at phase boundaries */}
        {[0, 25, 50, 75, 100].map((pct) => (
          <div
            key={pct}
            className="absolute"
            style={{
              left: `${pct}%`,
              top: "100%",
              transform: "translateX(-50%)",
            }}
          >
            <div
              className="w-px h-2 mx-auto"
              style={{
                background:
                  progress >= pct
                    ? "rgba(30, 215, 96, 0.5)"
                    : "var(--color-black-border)",
              }}
            />
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div
        className="flex justify-between mt-3 text-xs"
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
