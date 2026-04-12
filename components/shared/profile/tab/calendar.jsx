// components/shared/profile/tabs/CalendarTab.jsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";
import { useUnlockedWeeks, useAllWeekTitles, useWeekContent } from "@/hooks/use-profile";
import PaymentWidget from "../calendar/payment-widget";
import ProgressBar from "../calendar/progress-bar";
import WeekCard from "../calendar/week-card";
import WeekDetailModal from "../calendar/week-detail";
import { BookOpen, Target, Zap, Trophy, Flame, ChevronRight } from "lucide-react";

const PHASES = [
  {
    number: 1,
    weeks: [1, 13],
    label: "Phase 1",
    name: "Foundations",
    description: "Build your core knowledge and establish learning habits",
    icon: BookOpen,
    color: "#3b82f6",
    bg: "rgba(59, 130, 246, 0.06)",
    border: "rgba(59, 130, 246, 0.2)",
  },
  {
    number: 2,
    weeks: [14, 26],
    label: "Phase 2",
    name: "Core Concepts",
    description: "Deepen your understanding and connect ideas",
    icon: Target,
    color: "#8b5cf6",
    bg: "rgba(139, 92, 246, 0.06)",
    border: "rgba(139, 92, 246, 0.2)",
  },
  {
    number: 3,
    weeks: [27, 39],
    label: "Phase 3",
    name: "Advanced Practice",
    description: "Apply your skills to real challenges",
    icon: Zap,
    color: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.06)",
    border: "rgba(245, 158, 11, 0.2)",
  },
  {
    number: 4,
    weeks: [40, 52],
    label: "Phase 4",
    name: "Mastery",
    description: "Reach expert-level proficiency and lead",
    icon: Trophy,
    color: "#1ed760",
    bg: "rgba(30, 215, 96, 0.06)",
    border: "rgba(30, 215, 96, 0.2)",
  },
];

function PhaseSkeletonGrid() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
      {Array.from({ length: 13 }, (_, i) => (
        <div
          key={i}
          className="rounded-xl animate-pulse"
          style={{ background: "var(--elevated)", minHeight: "64px" }}
        />
      ))}
    </div>
  );
}

export default function CalendarTab({ profile }) {
  const { data: unlockedWeeks = [], isLoading: weeksLoading } = useUnlockedWeeks(profile?.user_id);
  const { data: weekTitles = {}, isLoading: titlesLoading } = useAllWeekTitles();
  const { selectedWeek, showWeekModal, setSelectedWeek } = useProfileStore();

  const currentWeek = profile?.current_week || 1;
  const isLoading = weeksLoading || titlesLoading;
  const isCurrentWeekUnlocked = unlockedWeeks.includes(currentWeek);
  const { data: currentWeekContent } = useWeekContent(currentWeek);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-xl animate-pulse" style={{ background: "var(--color-black-surface)" }} />
        <div className="h-64 rounded-xl animate-pulse" style={{ background: "var(--color-black-surface)" }} />
        {PHASES.map((phase) => (
          <div key={phase.number} className="space-y-3">
            <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--color-black-surface)" }} />
            <PhaseSkeletonGrid />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Current Week Spotlight (E6) */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="card p-5 flex items-start gap-4 cursor-pointer group"
        style={{
          background: isCurrentWeekUnlocked
            ? "linear-gradient(135deg, #0d1f12, var(--color-black-surface))"
            : "var(--color-black-surface)",
          border: isCurrentWeekUnlocked
            ? "1px solid rgba(30, 215, 96, 0.25)"
            : "1px solid var(--color-black-border)",
        }}
        onClick={() => setSelectedWeek(currentWeek)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === "Enter" && setSelectedWeek(currentWeek)}
        aria-label={`Open Week ${currentWeek}`}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
          style={{
            background: isCurrentWeekUnlocked
              ? "rgba(30, 215, 96, 0.15)"
              : "var(--elevated)",
          }}
        >
          <Flame
            className="w-5 h-5"
            style={{ color: isCurrentWeekUnlocked ? "#1ed760" : "var(--text-muted)" }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span
              className="text-xs font-bold uppercase tracking-widest"
              style={{ color: isCurrentWeekUnlocked ? "#1ed760" : "var(--text-muted)" }}
            >
              Week {currentWeek} — Now Studying
            </span>
          </div>
          {currentWeekContent?.title ? (
            <h3 className="font-bold text-base truncate" style={{ color: "var(--text-primary)" }}>
              {currentWeekContent.title}
            </h3>
          ) : (
            <h3 className="font-bold text-base" style={{ color: "var(--text-primary)" }}>
              Week {currentWeek}
            </h3>
          )}
          {currentWeekContent?.summary && (
            <p
              className="text-xs mt-1 line-clamp-2"
              style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}
            >
              {currentWeekContent.summary}
            </p>
          )}
        </div>
        <ChevronRight
          className="w-4 h-4 shrink-0 mt-1 transition-transform group-hover:translate-x-0.5"
          style={{ color: "var(--text-muted)" }}
        />
      </motion.div>

      {/* Progress Overview */}
      <ProgressBar
        unlockedWeeks={unlockedWeeks.length}
        totalWeeks={52}
        currentWeek={currentWeek}
      />

      {/* Payment Widget */}
      <PaymentWidget profile={profile} />

      {/* Phased Curriculum Grid */}
      <div className="space-y-8">
        <div>
          <h2
            className="text-xl font-bold mb-1"
            style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
          >
            52-Week Curriculum
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Your full learning journey, organised by phase
          </p>
        </div>

        {PHASES.map((phase, phaseIndex) => {
          const [start, end] = phase.weeks;
          const phaseWeeks = Array.from({ length: end - start + 1 }, (_, i) => start + i);
          const unlockedInPhase = phaseWeeks.filter((w) => unlockedWeeks.includes(w)).length;
          const isPhaseStarted = unlockedInPhase > 0;
          const isPhaseComplete = unlockedInPhase === phaseWeeks.length;
          const PhaseIcon = phase.icon;

          return (
            <motion.div
              key={phase.number}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: phaseIndex * 0.1, duration: 0.4 }}
            >
              {/* Phase Header */}
              <div
                className="rounded-2xl p-4 mb-3"
                style={{
                  background: phase.bg,
                  border: `1px solid ${phase.border}`,
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{ background: `${phase.color}20` }}
                    >
                      <PhaseIcon className="w-4 h-4" style={{ color: phase.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: phase.color }}
                        >
                          {phase.label}
                        </span>
                        {isPhaseComplete && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-semibold"
                            style={{ background: `${phase.color}20`, color: phase.color }}
                          >
                            Complete
                          </span>
                        )}
                      </div>
                      <h3
                        className="font-bold text-base leading-tight"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {phase.name}
                      </h3>
                      <p className="text-xs mt-0.5 hidden sm:block" style={{ color: "var(--text-muted)" }}>
                        {phase.description}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-lg font-bold" style={{ color: phase.color }}>
                      {unlockedInPhase}
                      <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
                        /{phaseWeeks.length}
                      </span>
                    </span>
                    <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                      weeks
                    </p>
                  </div>
                </div>

                {/* Phase progress micro-bar */}
                {isPhaseStarted && (
                  <div className="mt-3">
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--color-black-border)" }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(unlockedInPhase / phaseWeeks.length) * 100}%` }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: phaseIndex * 0.1 }}
                        className="h-full rounded-full"
                        style={{ background: phase.color }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Week cards grid */}
              <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
                {phaseWeeks.map((weekNumber) => (
                  <WeekCard
                    key={weekNumber}
                    weekNumber={weekNumber}
                    isUnlocked={unlockedWeeks.includes(weekNumber)}
                    isCurrent={weekNumber === currentWeek}
                    isUpcoming={weekNumber === currentWeek + 1}
                    title={weekTitles[weekNumber] || null}
                  />
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Week Detail Modal */}
      <AnimatePresence>
        {showWeekModal && selectedWeek && (
          <WeekDetailModal
            weekNumber={selectedWeek}
            profile={profile}
            isUnlocked={unlockedWeeks.includes(selectedWeek)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
