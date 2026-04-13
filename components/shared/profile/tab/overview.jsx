// components/shared/profile/tabs/OverviewTab.jsx

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Unlock,
  Lock,
  TrendingUp,
  Target,
  PenLine,
  ChevronRight,
  Flame,
  GraduationCap,
  Users,
} from "lucide-react";
import { useProfileStore } from "@/lib/store/profile-store";

const PHASES = [
  { label: "Foundations", weeks: [1, 13], color: "#3b82f6" },
  { label: "Core Concepts", weeks: [14, 26], color: "#8b5cf6" },
  { label: "Advanced Practice", weeks: [27, 39], color: "#f59e0b" },
  { label: "Mastery", weeks: [40, 52], color: "#1ed760" },
];

function getCurrentPhase(unlockedWeeks) {
  for (let i = PHASES.length - 1; i >= 0; i--) {
    const [start] = PHASES[i].weeks;
    if (unlockedWeeks >= start) return PHASES[i];
  }
  return PHASES[0];
}

export default function OverviewTab({ profile }) {
  const { setActiveTab } = useProfileStore();
  const unlockedCount = profile?.stats?.unlockedWeeks || 0;
  const currentWeek = profile?.current_week || 1;
  const progress = profile?.stats?.progress || 0;
  const currentPhase = getCurrentPhase(unlockedCount);

  const goToPayment = () => {
    setActiveTab("calendar");
    setTimeout(() => {
      document.getElementById("payment-widget")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  };

  const goToCalendar = () => setActiveTab("calendar");

  const stats = useMemo(() => [
    {
      label: "Current Week",
      value: `Week ${currentWeek}`,
      sub: "Your active lesson",
      Icon: Flame,
      color: "#1ed760",
    },
    {
      label: "Weeks Completed",
      value: unlockedCount,
      sub: `of 52 total`,
      Icon: Unlock,
      color: "#3b82f6",
      trend: unlockedCount > 0 ? "up" : null,
    },
    {
      label: "Weeks Remaining",
      value: 52 - unlockedCount,
      sub: "to full completion",
      Icon: Lock,
      color: "#f59e0b",
      trend: null,
    },
    {
      label: "Program Progress",
      value: `${Math.round(progress)}%`,
      sub: currentPhase.label,
      Icon: GraduationCap,
      color: currentPhase.color,
      trend: progress > 0 ? "up" : null,
    },
  ], [currentWeek, unlockedCount, progress, currentPhase]);

  return (
    <div className="space-y-6">
      {/* Learning Journey Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card p-6"
        style={{
          background: "linear-gradient(180deg, #0d1f12, var(--color-black-surface))",
          border: "1px solid rgba(30, 215, 96, 0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: "#1ed760" }}>
              Your Learning Journey
            </p>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-satoshi)" }}
            >
              {unlockedCount === 0
                ? "Ready to begin?"
                : `${currentPhase.label}`}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {unlockedCount === 0
                ? "Unlock your first week and start your 52-week journey today."
                : `You're on Week ${currentWeek} and have completed ${unlockedCount} of 52 weeks. Keep going.`}
            </p>
          </div>
          <div
            className="text-right shrink-0"
          >
            <div className="text-4xl font-bold" style={{ color: "#1ed760" }}>
              {Math.round(progress)}%
            </div>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>complete</p>
          </div>
        </div>

        {/* Full progress bar */}
        <div className="mt-4">
          <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
              className="h-full rounded-full"
              style={{ background: "linear-gradient(90deg, #1ed760, #16b455)" }}
            />
          </div>
          {/* Phase labels */}
          <div className="flex justify-between mt-2">
            {PHASES.map((phase) => (
              <div key={phase.label} className="flex flex-col items-center" style={{ width: "25%" }}>
                <div
                  className="w-1.5 h-1.5 rounded-full mb-1"
                  style={{ background: unlockedCount >= phase.weeks[0] ? phase.color : "var(--color-black-border)" }}
                />
                <span
                  className="text-[9px] font-semibold uppercase tracking-wide hidden sm:block"
                  style={{ color: unlockedCount >= phase.weeks[0] ? phase.color : "var(--text-muted)" }}
                >
                  {phase.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.07, duration: 0.35 }}
            className="card p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${stat.color}18` }}
              >
                <stat.Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              {stat.trend === "up" && (
                <TrendingUp className="w-3.5 h-3.5" style={{ color: stat.color, opacity: 0.6 }} />
              )}
            </div>
            <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {stat.value}
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {stat.label}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              {stat.sub}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Notes Spotlight (E7) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.35 }}
        className="card p-5"
        style={{
          background: "rgba(245, 158, 11, 0.04)",
          border: "1px solid rgba(245, 158, 11, 0.2)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(245, 158, 11, 0.12)" }}
          >
            <PenLine className="w-5 h-5" style={{ color: "#f59e0b" }} />
          </div>
          <div className="flex-1">
            <h4 className="font-bold mb-0.5" style={{ color: "var(--text-primary)" }}>
              Learning Notes
            </h4>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              Each unlocked week has a personal notes section — write your key takeaways,
              questions, and ideas as you learn. Go to Calendar and click any unlocked week to start.
            </p>
          </div>
          <button
            onClick={goToCalendar}
            className="shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
            style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}
          >
            Open
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>

      {/* Cohort Signal (E11) */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.35 }}
        className="card p-5"
        style={{
          background: "rgba(59, 130, 246, 0.04)",
          border: "1px solid rgba(59, 130, 246, 0.2)",
        }}
      >
        <div className="flex items-start gap-4">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: "rgba(59, 130, 246, 0.12)" }}
          >
            <Users className="w-5 h-5" style={{ color: "#3b82f6" }} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h4 className="font-bold" style={{ color: "var(--text-primary)" }}>
                Your Cohort
              </h4>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
                style={{
                  background: profile?.account_type === "nigerian"
                    ? "rgba(30, 215, 96, 0.15)"
                    : "rgba(59, 130, 246, 0.15)",
                  color: profile?.account_type === "nigerian" ? "#1ed760" : "#3b82f6",
                }}
              >
                {profile?.account_type === "nigerian" ? "Nigerian" : "International"}
              </span>
            </div>
            <p className="text-sm mb-3" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              You&apos;re part of the <strong style={{ color: "var(--text-primary)" }}>{currentPhase.label}</strong> phase.
              Keep up with your cohort — consistency is what separates those who finish.
            </p>
            {/* Peer presence indicator — colour dots, no fake initials */}
            <div className="flex items-center gap-3">
              <div className="flex items-end gap-1">
                {[
                  { color: "#1ed760", size: 10, opacity: 1 },
                  { color: "#3b82f6", size: 8, opacity: 0.85 },
                  { color: "#f59e0b", size: 12, opacity: 1 },
                  { color: "#8b5cf6", size: 7, opacity: 0.7 },
                  { color: "#1ed760", size: 9, opacity: 0.6 },
                  { color: "#3b82f6", size: 11, opacity: 0.5 },
                ].map((dot, i) => (
                  <div
                    key={i}
                    className="rounded-full"
                    style={{
                      width: dot.size,
                      height: dot.size,
                      background: dot.color,
                      opacity: dot.opacity,
                    }}
                  />
                ))}
              </div>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Learners active on Week {currentWeek}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.62, duration: 0.35 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        <button
          onClick={goToPayment}
          className="card-interactive p-5 text-left flex items-center gap-4"
          style={{
            background: "#1a3a22",
            border: "1px solid rgba(30, 215, 96, 0.25)",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(30, 215, 96, 0.15)" }}
          >
            <Target className="w-5 h-5" style={{ color: "#1ed760" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Unlock More Weeks
            </h4>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              Continue your learning journey
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "#1ed760" }} />
        </button>

        <button
          onClick={goToCalendar}
          className="card-interactive p-5 text-left flex items-center gap-4"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(59, 130, 246, 0.12)" }}
          >
            <BookOpen className="w-5 h-5" style={{ color: "#3b82f6" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
              Browse Curriculum
            </h4>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>
              See all 52 weeks by phase
            </p>
          </div>
          <ChevronRight className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        </button>
      </motion.div>
    </div>
  );
}
