// components/shared/profile/tab/scores.jsx
// Student-facing weekly exam scores tab

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Award,
  TrendingUp,
  Lock,
  CheckCircle,
  Clock,
  GraduationCap,
  FileText,
  ChevronRight,
  BarChart3,
  Star,
} from "lucide-react";
import { useMyScores } from "@/hooks/use-profile";

// ─── Grade helpers (Nigerian 5-point scale) ───────────────────────────────────
function getGradeInfo(score) {
  const n = parseFloat(score);
  if (n >= 70) return { grade: "A", gp: 5.0, label: "Excellent", color: "#1ed760", bg: "#1ed76015", ring: "#1ed76030" };
  if (n >= 60) return { grade: "B", gp: 4.0, label: "Good",      color: "#3b82f6", bg: "#3b82f615", ring: "#3b82f630" };
  if (n >= 50) return { grade: "C", gp: 3.0, label: "Average",   color: "#a78bfa", bg: "#a78bfa15", ring: "#a78bfa30" };
  if (n >= 45) return { grade: "D", gp: 2.0, label: "Pass",      color: "#f59e0b", bg: "#f59e0b15", ring: "#f59e0b30" };
  if (n >= 40) return { grade: "E", gp: 1.0, label: "Marginal",  color: "#f97316", bg: "#f9731615", ring: "#f9731630" };
  return              { grade: "F", gp: 0.0, label: "Fail",       color: "#ef4444", bg: "#ef444415", ring: "#ef444430" };
}

function getCgpaClass(cgpa) {
  if (cgpa >= 4.50) return { label: "First Class",           color: "#1ed760" };
  if (cgpa >= 3.50) return { label: "Second Class Upper",    color: "#3b82f6" };
  if (cgpa >= 2.40) return { label: "Second Class Lower",    color: "#a78bfa" };
  if (cgpa >= 1.50) return { label: "Third Class",           color: "#f59e0b" };
  if (cgpa >= 1.00) return { label: "Pass",                  color: "#f97316" };
  return                   { label: "Fail",                  color: "#ef4444" };
}

const PHASES = [
  { label: "Foundations",       weeks: [1,  13], color: "#3b82f6" },
  { label: "Core Concepts",     weeks: [14, 26], color: "#8b5cf6" },
  { label: "Advanced Practice", weeks: [27, 39], color: "#f59e0b" },
  { label: "Mastery",           weeks: [40, 52], color: "#1ed760" },
];

function getPhase(weekNumber) {
  return (
    PHASES.find((p) => weekNumber >= p.weeks[0] && weekNumber <= p.weeks[1]) ??
    PHASES[0]
  );
}

export default function ScoresTab({ profile }) {
  const userId = profile?.user_id ?? profile?.id;
  const unlockedWeeks = profile?.stats?.unlockedWeeks ?? 0;

  const { data: scores = [], isLoading } = useMyScores(userId);

  // Build a lookup map week_number → score row
  const scoresMap = useMemo(() => {
    const map = {};
    scores.forEach((s) => { map[s.week_number] = s; });
    return map;
  }, [scores]);

  // CGPA calculation: sum(grade_point) / count
  const cgpa = useMemo(() => {
    if (!scores.length) return null;
    const total = scores.reduce((acc, s) => acc + parseFloat(s.grade_point), 0);
    return (total / scores.length).toFixed(2);
  }, [scores]);

  const cgpaClass = cgpa ? getCgpaClass(parseFloat(cgpa)) : null;

  const bestScore  = useMemo(() => scores.length ? Math.max(...scores.map((s) => s.score)) : null, [scores]);
  const avgScore   = useMemo(() => {
    if (!scores.length) return null;
    return (scores.reduce((a, s) => a + parseFloat(s.score), 0) / scores.length).toFixed(1);
  }, [scores]);

  const totalScored  = scores.length;
  const allComplete  = totalScored === 52;

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-xl animate-pulse"
            style={{ background: "var(--color-black-surface)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Summary banner ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="card p-6"
        style={{
          background: "linear-gradient(160deg, #0d1f12, var(--color-black-surface))",
          border: "1px solid rgba(30,215,96,0.2)",
        }}
      >
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: "#1ed760" }}
            >
              Academic Record
            </p>
            <h2
              className="text-2xl font-bold mb-1"
              style={{ color: "var(--text-primary)", fontFamily: "var(--font-satoshi)" }}
            >
              {totalScored === 0
                ? "Results will appear here"
                : cgpaClass
                  ? cgpaClass.label
                  : "In Progress"}
            </h2>
            <p className="text-sm" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
              {totalScored === 0
                ? "Exam scores are uploaded by the admin after each weekly exam."
                : `${totalScored} of 52 weeks scored · Nigerian 5-point GP scale`}
            </p>
          </div>

          {cgpa && (
            <div className="text-right shrink-0">
              <div className="text-4xl font-bold" style={{ color: cgpaClass?.color ?? "#1ed760" }}>
                {cgpa}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>CGPA / 5.0</p>
            </div>
          )}
        </div>

        {/* Transcript CTA — only when all 52 weeks have scores */}
        {allComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-4 pt-4 border-t"
            style={{ borderColor: "rgba(30,215,96,0.2)" }}
          >
            <Link
              href="/profile/transcript"
              className="inline-flex items-center gap-3 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "#1ed760", color: "#000" }}
            >
              <FileText className="w-4 h-4" />
              Download Transcript
              <ChevronRight className="w-4 h-4" />
            </Link>
            <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
              All 52 weeks complete — your official transcript is ready.
            </p>
          </motion.div>
        )}
      </motion.div>

      {/* ── Stats row ────────────────────────────────────────────────────────── */}
      {totalScored > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            {
              label: "CGPA",
              value: cgpa ?? "—",
              sub: cgpaClass?.label ?? "",
              color: cgpaClass?.color ?? "#1ed760",
              Icon: Award,
            },
            {
              label: "Average",
              value: avgScore !== null ? `${avgScore}%` : "—",
              sub: "across all scored weeks",
              color: "#3b82f6",
              Icon: BarChart3,
            },
            {
              label: "Best Score",
              value: bestScore !== null ? `${bestScore}%` : "—",
              sub: bestScore !== null ? getGradeInfo(bestScore).label : "",
              color: "#f59e0b",
              Icon: Star,
            },
            {
              label: "Weeks Scored",
              value: `${totalScored}/52`,
              sub: allComplete ? "Complete!" : `${52 - totalScored} pending`,
              color: "#1ed760",
              Icon: CheckCircle,
            },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.07 }}
              className="card p-5"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: `${stat.color}18` }}
              >
                <stat.Icon className="w-4 h-4" style={{ color: stat.color }} />
              </div>
              <h3 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {stat.value}
              </h3>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {stat.label}
              </p>
              {stat.sub && (
                <p className="text-xs mt-0.5" style={{ color: stat.color }}>
                  {stat.sub}
                </p>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Incomplete transcript notice ─────────────────────────────────────── */}
      {totalScored > 0 && !allComplete && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="card p-4 flex items-center gap-4"
          style={{
            background: "rgba(59,130,246,0.05)",
            border: "1px solid rgba(59,130,246,0.2)",
          }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "rgba(59,130,246,0.12)" }}
          >
            <GraduationCap className="w-5 h-5" style={{ color: "#3b82f6" }} />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
              Transcript available after all 52 weeks
            </p>
            <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
              {52 - totalScored} more week{52 - totalScored !== 1 ? "s" : ""} to go before your transcript is unlocked.
            </p>
          </div>
        </motion.div>
      )}

      {/* ── Week scores list by phase ────────────────────────────────────────── */}
      {PHASES.map((phase) => {
        const weekRange = Array.from(
          { length: phase.weeks[1] - phase.weeks[0] + 1 },
          (_, i) => phase.weeks[0] + i,
        );

        const phaseScores = weekRange.filter((w) => scoresMap[w]);
        const hasAny = phaseScores.length > 0;

        return (
          <motion.div
            key={phase.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="card rounded-xl overflow-hidden"
          >
            {/* Phase header */}
            <div
              className="px-5 py-3.5 flex items-center gap-3 border-b"
              style={{ borderColor: "var(--color-black-border)", background: `${phase.color}08` }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ background: phase.color }}
              />
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                {phase.label}
              </h3>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                Weeks {phase.weeks[0]}–{phase.weeks[1]}
              </span>
              <span
                className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                style={{ background: `${phase.color}15`, color: phase.color }}
              >
                {phaseScores.length} / {weekRange.length} scored
              </span>
            </div>

            {/* Week rows */}
            <div className="divide-y" style={{ "--divide-color": "var(--color-black-border)" }}>
              {weekRange.map((weekNum, idx) => {
                const scoreRow    = scoresMap[weekNum];
                const isUnlocked  = weekNum <= unlockedWeeks;
                const gradeInfo   = scoreRow ? getGradeInfo(scoreRow.score) : null;
                const phase_color = phase.color;

                return (
                  <motion.div
                    key={weekNum}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: Math.min(idx * 0.015, 0.3) }}
                    className="px-5 py-3.5 flex items-center gap-4"
                    style={{ borderTop: idx > 0 ? "1px solid var(--color-black-border)" : undefined }}
                  >
                    {/* Week badge */}
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
                      style={{
                        background: scoreRow ? gradeInfo.bg : `${phase_color}10`,
                        color: scoreRow ? gradeInfo.color : phase_color,
                        border: `1px solid ${scoreRow ? gradeInfo.ring : `${phase_color}20`}`,
                      }}
                    >
                      {weekNum}
                    </div>

                    {/* Week info */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                        Week {weekNum}
                      </p>
                      {scoreRow?.remarks && (
                        <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                          {scoreRow.remarks}
                        </p>
                      )}
                    </div>

                    {/* Score display */}
                    {scoreRow ? (
                      <div className="flex items-center gap-3 shrink-0">
                        {/* Score */}
                        <div className="text-right">
                          <p className="font-bold text-sm" style={{ color: gradeInfo.color }}>
                            {parseFloat(scoreRow.score).toFixed(1)}%
                          </p>
                          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                            GP: {parseFloat(scoreRow.grade_point).toFixed(1)}
                          </p>
                        </div>

                        {/* Grade badge */}
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0"
                          style={{ background: gradeInfo.bg, color: gradeInfo.color }}
                        >
                          {gradeInfo.grade}
                        </div>
                      </div>
                    ) : isUnlocked ? (
                      <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        <Clock className="w-3.5 h-3.5" />
                        Awaiting results
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        <Lock className="w-3.5 h-3.5" />
                        Locked
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        );
      })}

      {/* ── GP scale legend ──────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="card p-5"
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-3"
          style={{ color: "var(--text-muted)" }}
        >
          Nigerian 5-Point Grading Scale
        </p>
        <div className="flex flex-wrap gap-3">
          {[
            { range: "70–100", grade: "A", gp: "5.0", label: "Excellent", color: "#1ed760" },
            { range: "60–69",  grade: "B", gp: "4.0", label: "Good",      color: "#3b82f6" },
            { range: "50–59",  grade: "C", gp: "3.0", label: "Average",   color: "#a78bfa" },
            { range: "45–49",  grade: "D", gp: "2.0", label: "Pass",      color: "#f59e0b" },
            { range: "40–44",  grade: "E", gp: "1.0", label: "Marginal",  color: "#f97316" },
            { range: "0–39",   grade: "F", gp: "0.0", label: "Fail",      color: "#ef4444" },
          ].map(({ range, grade, gp, label, color }) => (
            <div
              key={grade}
              className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background: `${color}10`, border: `1px solid ${color}25` }}
            >
              <span className="font-bold text-sm" style={{ color }}>
                {grade}
              </span>
              <div>
                <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                  {label} · GP {gp}
                </p>
                <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                  {range}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
