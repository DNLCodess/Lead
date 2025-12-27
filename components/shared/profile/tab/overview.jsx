// app/profile/components/tabs/OverviewTab.jsx

"use client";

import { motion } from "framer-motion";
import {
  BookOpen,
  Unlock,
  Lock,
  Wallet,
  TrendingUp,
  Target,
  Book,
} from "lucide-react";

export default function OverviewTab({ profile }) {
  const isNigerian = profile?.account_type === "nigerian";
  const currency = isNigerian ? "₦" : "$";

  const stats = [
    {
      label: "Total Weeks",
      value: "52",
      Icon: BookOpen,
      color: "#3b82f6",
    },
    {
      label: "Unlocked",
      value: profile?.stats?.unlockedWeeks || 0,
      Icon: Unlock,
      color: "#1ed760",
    },
    {
      label: "Remaining",
      value: 52 - (profile?.stats?.unlockedWeeks || 0),
      Icon: Lock,
      color: "#f59e0b",
    },
    {
      label: "Total Invested",
      value: `${currency}${profile?.stats?.totalSpent?.toLocaleString() || 0}`,
      Icon: Wallet,
      color: "#8b5cf6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="p-6 rounded-xl"
            style={{
              background: "var(--color-black-surface)",
              border: "1px solid var(--color-black-border)",
              borderRadius: "1.2rem",
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <stat.Icon className="w-8 h-8" style={{ color: stat.color }} />

              <div
                className="w-12 h-12 rounded-full flex items-center justify-center"
                style={{
                  background: `${stat.color}20`,
                  color: stat.color,
                }}
              >
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>

            <h3
              className="text-3xl font-bold mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              {stat.value}
            </h3>

            <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
              {stat.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="p-6 rounded-xl"
        style={{
          background: "var(--color-black-surface)",
          border: "1px solid var(--color-black-border)",
          borderRadius: "1rem",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3
            className="text-xl font-bold"
            style={{ color: "var(--text-primary)" }}
          >
            Learning Progress
          </h3>
          <span className="text-2xl font-bold text-green-500">
            {Math.round(profile?.stats?.progress || 0)}%
          </span>
        </div>

        <div
          className="h-4 rounded-full overflow-hidden"
          style={{ background: "var(--color-black-border)" }}
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${profile?.stats?.progress || 0}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #1ed760, #16b455)",
            }}
          />
        </div>

        <p className="mt-3 text-sm" style={{ color: "var(--text-secondary)" }}>
          You&apos;ve unlocked {profile?.stats?.unlockedWeeks || 0} of 52 weeks.
          Keep going!
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <button
          className="p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #1ed760, #16b455)",
            color: "#ffffff",
            borderRadius: "1.2rem",
          }}
        >
          <Target className="w-8 h-8 mb-3" />
          <h4 className="text-xl font-bold mb-2">Unlock More Weeks</h4>
          <p className="text-sm opacity-90">
            Continue your learning journey by unlocking additional weeks
          </p>
        </button>

        <button
          className="p-6 rounded-xl text-left transition-all hover:scale-[1.02]"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
            borderRadius: "1.2rem",
          }}
        >
          <Book className="w-8 h-8 mb-3 text-green-500" />
          <h4 className="text-xl font-bold mb-2">View Resources</h4>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Access all your learning materials and resources
          </p>
        </button>
      </motion.div>
    </div>
  );
}
