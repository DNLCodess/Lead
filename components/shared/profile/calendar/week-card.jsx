// app/profile/components/calendar/WeekCard.jsx

"use client";

import { motion } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";

export default function WeekCard({
  weekNumber,
  isUnlocked,
  isCurrent,
  isUpcoming,
}) {
  const { setSelectedWeek } = useProfileStore();

  const getCardStyle = () => {
    if (isCurrent) {
      return {
        background: "linear-gradient(135deg, #1ed760, #16b455)",
        border: "2px solid #1ed760",
        color: "#ffffff",
      };
    }
    if (isUnlocked) {
      return {
        background: "#145a32",
        border: "1px solid #16b455",
        color: "#7ee2a8",
      };
    }
    if (isUpcoming) {
      return {
        background: "var(--color-black-elevated)",
        border: "1px solid #7ee2a8",
        color: "var(--text-secondary)",
      };
    }
    return {
      background: "var(--color-black-border)",
      border: "1px solid transparent",
      color: "var(--text-muted)",
    };
  };

  return (
    <motion.button
      whileHover={{ scale: isUnlocked || isCurrent ? 1.1 : 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={() => setSelectedWeek(weekNumber)}
      className="relative aspect-square rounded-lg font-bold text-sm transition-all"
      style={getCardStyle()}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-lg mb-1">
          {isCurrent ? "🎯" : isUnlocked ? "✓" : isUpcoming ? "🔜" : "🔒"}
        </div>
        <div>{weekNumber}</div>
      </div>

      {isCurrent && (
        <motion.div
          className="absolute inset-0 rounded-lg"
          style={{
            background: "linear-gradient(135deg, #1ed760, #16b455)",
            opacity: 0.2,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}
    </motion.button>
  );
}
