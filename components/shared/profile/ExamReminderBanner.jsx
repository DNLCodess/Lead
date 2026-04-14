// components/shared/profile/ExamReminderBanner.jsx
// Shows an in-app banner reminding the student of their upcoming exam.
// Appears when the student's current week has an exam_date within the next 14 days.

"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, Calendar, Clock, ExternalLink } from "lucide-react";
import { useCurrentWeekExam } from "@/hooks/use-profile";

function getDaysUntil(dateStr) {
  if (!dateStr) return null;
  const now = new Date();
  const exam = new Date(dateStr);
  return Math.ceil((exam - now) / (1000 * 60 * 60 * 24));
}

export default function ExamReminderBanner({ currentWeek }) {
  const [dismissed, setDismissed] = useState(false);
  const { data: examData } = useCurrentWeekExam(currentWeek);

  const { show, urgency, daysUntil, formattedDate, formattedTime } = useMemo(() => {
    if (!examData?.exam_date) return { show: false };
    const days = getDaysUntil(examData.exam_date);
    // Show if exam is within 14 days and hasn't passed more than 1 day ago
    if (days === null || days < -1 || days > 14) return { show: false };

    const d = new Date(examData.exam_date);
    const formattedDate = d.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    const formattedTime = d.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Urgency levels
    let urgency = "normal"; // > 7 days
    if (days <= 0) urgency = "today";
    else if (days <= 2) urgency = "imminent";
    else if (days <= 7) urgency = "soon";

    return { show: true, urgency, daysUntil: days, formattedDate, formattedTime };
  }, [examData]);

  if (!show || dismissed) return null;

  const config = {
    today: {
      bg: "rgba(239, 68, 68, 0.08)",
      border: "rgba(239, 68, 68, 0.3)",
      iconBg: "rgba(239, 68, 68, 0.15)",
      iconColor: "#ef4444",
      badge: { bg: "#ef444420", color: "#ef4444", text: "TODAY" },
      headline:
        daysUntil === 0
          ? "Your exam is today!"
          : "Your exam was yesterday — check your results soon.",
    },
    imminent: {
      bg: "rgba(249, 115, 22, 0.06)",
      border: "rgba(249, 115, 22, 0.3)",
      iconBg: "rgba(249, 115, 22, 0.15)",
      iconColor: "#f97316",
      badge: { bg: "#f9731620", color: "#f97316", text: `${daysUntil} DAY${daysUntil !== 1 ? "S" : ""}` },
      headline: `Exam in ${daysUntil} day${daysUntil !== 1 ? "s" : ""} — make sure you're prepared!`,
    },
    soon: {
      bg: "rgba(245, 158, 11, 0.06)",
      border: "rgba(245, 158, 11, 0.25)",
      iconBg: "rgba(245, 158, 11, 0.15)",
      iconColor: "#f59e0b",
      badge: { bg: "#f59e0b20", color: "#f59e0b", text: `${daysUntil} DAYS` },
      headline: `Week ${currentWeek} exam in ${daysUntil} days`,
    },
    normal: {
      bg: "rgba(59, 130, 246, 0.06)",
      border: "rgba(59, 130, 246, 0.2)",
      iconBg: "rgba(59, 130, 246, 0.15)",
      iconColor: "#3b82f6",
      badge: { bg: "#3b82f620", color: "#3b82f6", text: `${daysUntil} DAYS` },
      headline: `Week ${currentWeek} exam coming up`,
    },
  }[urgency];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="mb-6 rounded-2xl p-4 flex items-start gap-4"
        style={{
          background: config.bg,
          border: `1px solid ${config.border}`,
        }}
      >
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: config.iconBg }}
        >
          <Bell className="w-5 h-5" style={{ color: config.iconColor }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
              style={{ background: config.badge.bg, color: config.badge.color }}
            >
              {config.badge.text}
            </span>
            <h4
              className="font-bold text-sm"
              style={{ color: "var(--text-primary)" }}
            >
              {config.headline}
            </h4>
          </div>

          <div className="flex items-center gap-4 flex-wrap mt-1">
            <span
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <Calendar className="w-3.5 h-3.5" style={{ color: config.iconColor }} />
              {formattedDate}
            </span>
            <span
              className="flex items-center gap-1.5 text-sm"
              style={{ color: "var(--text-secondary)" }}
            >
              <Clock className="w-3.5 h-3.5" style={{ color: config.iconColor }} />
              {formattedTime}
            </span>
          </div>

          {examData?.exam_description && (
            <p
              className="text-xs mt-1.5 leading-relaxed"
              style={{ color: "var(--text-muted)" }}
            >
              {examData.exam_description}
            </p>
          )}

          {examData?.exam_link && (
            <a
              href={examData.exam_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-2.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
              style={{ background: config.iconBg, color: config.iconColor }}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Open Exam Form
            </a>
          )}
        </div>

        {/* Dismiss */}
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/5"
          style={{ color: "var(--text-muted)" }}
          aria-label="Dismiss exam reminder"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}
