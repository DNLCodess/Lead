// app/admin/dashboard/scores/page.jsx

"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  GraduationCap,
  Search,
  Save,
  Eye,
  Edit3,
  X,
  Loader2,
  CheckCircle,
  Users,
  Calendar,
  Award,
  BarChart3,
  AlertCircle,
  Link as LinkIcon,
  ExternalLink,
} from "lucide-react";

// ─── Nigerian 5-point GP scale ────────────────────────────────────────────────
function getGradeInfo(score) {
  if (score === null || score === undefined || score === "")
    return { grade: "—", gp: "—", color: "var(--text-muted)", bg: "var(--color-black-elevated)" };
  const n = parseFloat(score);
  if (n >= 70) return { grade: "A", gp: 5.0, color: "#1ed760", bg: "#1ed76018" };
  if (n >= 60) return { grade: "B", gp: 4.0, color: "#3b82f6", bg: "#3b82f618" };
  if (n >= 50) return { grade: "C", gp: 3.0, color: "#a78bfa", bg: "#a78bfa18" };
  if (n >= 45) return { grade: "D", gp: 2.0, color: "#f59e0b", bg: "#f59e0b18" };
  if (n >= 40) return { grade: "E", gp: 1.0, color: "#f97316", bg: "#f9731618" };
  return { grade: "F", gp: 0.0, color: "#ef4444", bg: "#ef444418" };
}

// ─── Shared input style ───────────────────────────────────────────────────────
const inputStyle = {
  background: "var(--color-black-elevated)",
  border: "1px solid var(--color-black-border)",
  color: "var(--text-primary)",
};

export default function ScoresPage() {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const router = useRouter();

  const [selectedWeek, setSelectedWeek] = useState(1);
  const [search, setSearch] = useState("");
  // localScores: { [student_id]: { score: string, remarks: string } }
  const [localScores, setLocalScores] = useState({});
  const [dirty, setDirty] = useState(false);

  // Exam settings panel
  const [editingExam, setEditingExam] = useState(false);
  const [examDate, setExamDate] = useState("");
  const [examDesc, setExamDesc] = useState("");
  const [examLink, setExamLink] = useState("");

  // Save feedback
  const [saveResult, setSaveResult] = useState(null); // null | "ok" | "error"

  // ── Fetch all weeks (for grid + exam dots) ──────────────────────────────────
  const { data: weeksData } = useQuery({
    queryKey: ["admin-weeks-exam"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("week_content")
        .select("week_number, title, exam_date, exam_description, exam_link")
        .order("week_number");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedWeekMeta = useMemo(
    () => weeksData?.find((w) => w.week_number === selectedWeek) ?? null,
    [weeksData, selectedWeek],
  );

  // Sync exam fields when week changes or weeksData loads
  useEffect(() => {
    if (selectedWeekMeta) {
      setExamDate(
        selectedWeekMeta.exam_date
          ? new Date(selectedWeekMeta.exam_date).toISOString().slice(0, 16)
          : "",
      );
      setExamDesc(selectedWeekMeta.exam_description ?? "");
      setExamLink(selectedWeekMeta.exam_link ?? "");
    } else {
      setExamDate("");
      setExamDesc("");
      setExamLink("");
    }
    setEditingExam(false);
  }, [selectedWeekMeta]);

  // Helper: find the next Sunday at 10:00 AM
  const nextSundayAt10 = () => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sunday
    const daysUntilSunday = day === 0 ? 7 : 7 - day;
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + daysUntilSunday);
    sunday.setHours(10, 0, 0, 0);
    return sunday.toISOString().slice(0, 16);
  };

  // ── Fetch students + scores for selected week ───────────────────────────────
  const {
    data: studentsData,
    isLoading: studentsLoading,
    isError: studentsError,
  } = useQuery({
    queryKey: ["admin-week-students-scores", selectedWeek],
    staleTime: 30_000,
    queryFn: async () => {
      const res = await fetch(`/api/admin/scores?week_number=${selectedWeek}`);
      if (!res.ok) throw new Error("Failed to fetch students");
      return res.json();
    },
  });

  // Pre-populate local scores when server data arrives
  useEffect(() => {
    if (!studentsData?.students) return;
    const pre = {};
    studentsData.students.forEach((s) => {
      pre[s.student_id] = {
        score: s.score !== null ? String(s.score) : "",
        remarks: s.remarks ?? "",
      };
    });
    setLocalScores(pre);
    setDirty(false);
  }, [studentsData]);

  // ── Week selector handler ───────────────────────────────────────────────────
  const handleWeekSelect = (week) => {
    setSelectedWeek(week);
    setSearch("");
    setSaveResult(null);
    setDirty(false);
  };

  // ── Score input change ──────────────────────────────────────────────────────
  const handleScoreChange = useCallback((studentId, field, value) => {
    setLocalScores((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: value },
    }));
    setDirty(true);
  }, []);

  // ── Save exam date mutation ─────────────────────────────────────────────────
  const saveExamMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/scores/exam-date", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          week_number: selectedWeek,
          exam_date: examDate || null,
          exam_description: examDesc || null,
          exam_link: examLink || null,
        }),
      });
      if (!res.ok) throw new Error("Failed to save exam date");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-weeks-exam"]);
      setEditingExam(false);
    },
  });

  // ── Save scores mutation ────────────────────────────────────────────────────
  const saveScoresMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(localScores)
        .filter(([, v]) => v.score !== "")
        .map(([student_id, v]) => {
          const student = studentsData.students.find(
            (s) => s.student_id === student_id,
          );
          return {
            student_id,
            user_id: student.user_id,
            week_number: selectedWeek,
            score: parseFloat(v.score),
            remarks: v.remarks || null,
          };
        });

      if (payload.length === 0) throw new Error("No scores to save");

      const res = await fetch("/api/admin/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scores: payload }),
      });
      if (!res.ok) throw new Error("Failed to save scores");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-week-students-scores", selectedWeek]);
      setSaveResult("ok");
      setDirty(false);
      setTimeout(() => setSaveResult(null), 3500);
    },
    onError: () => {
      setSaveResult("error");
      setTimeout(() => setSaveResult(null), 4000);
    },
  });

  // ── Keyboard shortcut: Ctrl/Cmd + S ────────────────────────────────────────
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && dirty) {
        e.preventDefault();
        saveScoresMutation.mutate();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [dirty, saveScoresMutation]);

  // ── Derived stats ───────────────────────────────────────────────────────────
  const totalStudents = studentsData?.students?.length ?? 0;
  const scoredStudents = Object.values(localScores).filter(
    (v) => v.score !== "",
  ).length;

  const avgScore = useMemo(() => {
    const vals = Object.values(localScores)
      .map((v) => parseFloat(v.score))
      .filter((n) => !isNaN(n));
    if (!vals.length) return null;
    return (vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(1);
  }, [localScores]);

  const filteredStudents = useMemo(() => {
    if (!studentsData?.students) return [];
    const q = search.toLowerCase().trim();
    if (!q) return studentsData.students;
    return studentsData.students.filter(
      (s) =>
        s.first_name?.toLowerCase().includes(q) ||
        s.last_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q),
    );
  }, [studentsData, search]);

  // ── Score distribution for mini chart ──────────────────────────────────────
  const distribution = useMemo(() => {
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0, F: 0 };
    Object.values(localScores).forEach(({ score }) => {
      if (score === "") return;
      const { grade } = getGradeInfo(score);
      if (grade in counts) counts[grade]++;
    });
    return counts;
  }, [localScores]);

  return (
    <div className="space-y-6">
      {/* ── Page header ──────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1
            className="text-3xl font-bold mb-1"
            style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
          >
            Exam Scores
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Upload weekly exam scores · Nigerian 5-point GP scale · Ctrl+S to save
          </p>
        </div>

        <button
          onClick={() => router.push("/admin/dashboard/scores/transcript-preview")}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:scale-105"
          style={{
            background: "var(--color-black-elevated)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <Eye className="w-4 h-4" style={{ color: "#1ed760" }} />
          Preview Transcript
        </button>
      </div>

      {/* ── Week selector grid ───────────────────────────────────────────────── */}
      <div
        className="card rounded-xl p-5"
      >
        <p
          className="text-xs font-bold uppercase tracking-widest mb-4"
          style={{ color: "var(--text-muted)" }}
        >
          Select a Week
        </p>
        <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-13 gap-2">
          {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => {
            const wk = weeksData?.find((w) => w.week_number === week);
            const hasExam = !!wk?.exam_date;
            const isSelected = selectedWeek === week;

            return (
              <motion.button
                key={week}
                whileHover={{ scale: 1.07 }}
                whileTap={{ scale: 0.93 }}
                onClick={() => handleWeekSelect(week)}
                className="relative flex flex-col items-center justify-center py-3 rounded-xl font-bold transition-all"
                style={{
                  background: isSelected
                    ? "#1ed760"
                    : "var(--color-black-elevated)",
                  border: isSelected
                    ? "2px solid #1ed760"
                    : hasExam
                      ? "1px solid rgba(59,130,246,0.5)"
                      : "1px solid var(--color-black-border)",
                  color: isSelected ? "#000" : "var(--text-primary)",
                  boxShadow: isSelected
                    ? "0 0 16px rgba(30,215,96,0.3)"
                    : undefined,
                }}
              >
                {/* Exam date dot */}
                {hasExam && !isSelected && (
                  <span
                    className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
                    style={{ background: "#3b82f6" }}
                  />
                )}
                <span className="text-sm">
                  {week < 10 ? `0${week}` : week}
                </span>
              </motion.button>
            );
          })}
        </div>
        {/* Legend */}
        <div className="mt-3 flex items-center gap-5 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#3b82f6" }} />
            Exam date scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-2 h-2 rounded-full" style={{ background: "#1ed760" }} />
            Selected
          </span>
        </div>
      </div>

      {/* ── Main two-column area ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left panel: exam info + stats ──────────────────────────────────── */}
        <div className="space-y-4">

          {/* Exam settings card */}
          <div className="card rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" style={{ color: "#3b82f6" }} />
                <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                  Week {selectedWeek} Exam
                </h3>
              </div>
              {editingExam ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingExam(false)}
                    className="text-xs px-2 py-1 rounded-lg"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => saveExamMutation.mutate()}
                    disabled={saveExamMutation.isPending}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg disabled:opacity-60"
                    style={{ background: "#1ed760", color: "#000" }}
                  >
                    {saveExamMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Save className="w-3 h-3" />
                    )}
                    Save
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setEditingExam(true)}
                  className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105"
                  style={{ background: "var(--color-black-elevated)", color: "var(--text-secondary)" }}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit
                </button>
              )}
            </div>

            {/* Exam Date */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "var(--text-secondary)" }}>
                  Date &amp; Time
                </label>
                {editingExam && (
                  <button
                    type="button"
                    onClick={() => setExamDate(nextSundayAt10())}
                    className="text-xs font-semibold px-2.5 py-1 rounded-lg transition-all hover:scale-105"
                    style={{ background: "rgba(59,130,246,0.12)", color: "#3b82f6" }}
                  >
                    Next Sunday 10 AM
                  </button>
                )}
              </div>
              {editingExam ? (
                <input
                  type="datetime-local"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm"
                  style={inputStyle}
                />
              ) : (
                <p
                  className="text-sm font-semibold"
                  style={{ color: examDate ? "var(--text-primary)" : "var(--text-muted)" }}
                >
                  {examDate
                    ? new Date(examDate).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })
                    : "Not set"}
                </p>
              )}
            </div>

            {/* Google Forms exam link */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Google Forms Link
              </label>
              {editingExam ? (
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                  <input
                    type="url"
                    value={examLink}
                    onChange={(e) => setExamLink(e.target.value)}
                    className="flex-1 px-3 py-2.5 rounded-xl outline-none text-sm"
                    style={inputStyle}
                    placeholder="https://forms.gle/…"
                  />
                </div>
              ) : examLink ? (
                <a
                  href={examLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold transition-all hover:opacity-80"
                  style={{ color: "#3b82f6" }}
                >
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Open Exam Form</span>
                </a>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No link set
                </p>
              )}
            </div>

            {/* Exam instructions */}
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: "var(--text-secondary)" }}>
                Instructions / Notes
              </label>
              {editingExam ? (
                <textarea
                  value={examDesc}
                  onChange={(e) => setExamDesc(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl outline-none text-sm resize-none"
                  style={inputStyle}
                  placeholder="e.g. Open-book, covers weeks 1–4…"
                />
              ) : (
                <p
                  className="text-sm leading-relaxed"
                  style={{ color: examDesc ? "var(--text-secondary)" : "var(--text-muted)" }}
                >
                  {examDesc || "No notes"}
                </p>
              )}
            </div>
          </div>

          {/* Stats card */}
          <div className="card rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" style={{ color: "#f59e0b" }} />
              <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                This Week
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Students", value: totalStudents, color: "#1ed760" },
                { label: "Scored", value: scoredStudents, color: "#3b82f6" },
                {
                  label: "Avg Score",
                  value: avgScore !== null ? `${avgScore}%` : "—",
                  color: "#f59e0b",
                },
                {
                  label: "Pending",
                  value: totalStudents - scoredStudents,
                  color: "#f97316",
                },
              ].map(({ label, value, color }) => (
                <div
                  key={label}
                  className="p-3 rounded-xl text-center"
                  style={{ background: "var(--color-black-elevated)" }}
                >
                  <div className="text-xl font-bold" style={{ color }}>
                    {value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {label}
                  </div>
                </div>
              ))}
            </div>

            {/* Grade distribution mini-bars */}
            {scoredStudents > 0 && (
              <div className="space-y-1.5 pt-2">
                <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                  Distribution
                </p>
                {Object.entries(distribution).map(([grade, count]) => {
                  const { color } = getGradeInfo(
                    grade === "A" ? 75 : grade === "B" ? 65 : grade === "C" ? 55
                    : grade === "D" ? 47 : grade === "E" ? 42 : 20,
                  );
                  const pct = scoredStudents > 0 ? (count / scoredStudents) * 100 : 0;
                  return (
                    <div key={grade} className="flex items-center gap-2">
                      <span
                        className="w-5 text-xs font-bold text-right"
                        style={{ color }}
                      >
                        {grade}
                      </span>
                      <div
                        className="flex-1 h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--color-black-border)" }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.4 }}
                          className="h-full rounded-full"
                          style={{ background: color }}
                        />
                      </div>
                      <span className="w-5 text-xs" style={{ color: "var(--text-muted)" }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right panel: student list + score inputs ────────────────────────── */}
        <div className="lg:col-span-2 card rounded-xl overflow-hidden flex flex-col">

          {/* Table header */}
          <div
            className="px-5 py-4 border-b flex items-center gap-3 flex-wrap"
            style={{ borderColor: "var(--color-black-border)" }}
          >
            {/* Search */}
            <div className="flex-1 relative min-w-40">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search students…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={inputStyle}
              />
            </div>

            {/* Save button */}
            <AnimatePresence mode="wait">
              {saveResult === "ok" ? (
                <motion.div
                  key="ok"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "#1ed76020", color: "#1ed760" }}
                >
                  <CheckCircle className="w-4 h-4" />
                  Saved!
                </motion.div>
              ) : saveResult === "error" ? (
                <motion.div
                  key="err"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm"
                  style={{ background: "#ef444420", color: "#ef4444" }}
                >
                  <AlertCircle className="w-4 h-4" />
                  Error saving
                </motion.div>
              ) : dirty || scoredStudents > 0 ? (
                <motion.button
                  key="save"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => saveScoresMutation.mutate()}
                  disabled={saveScoresMutation.isPending || !dirty}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 transition-all hover:scale-105"
                  style={{
                    background: dirty ? "#1ed760" : "var(--color-black-elevated)",
                    color: dirty ? "#000" : "var(--text-muted)",
                  }}
                >
                  {saveScoresMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  {saveScoresMutation.isPending
                    ? "Saving…"
                    : dirty
                      ? `Save ${scoredStudents} score${scoredStudents !== 1 ? "s" : ""}`
                      : "Up to date"}
                </motion.button>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Column headers */}
          <div
            className="px-5 py-2.5 grid text-xs font-bold uppercase tracking-wider"
            style={{
              color: "var(--text-muted)",
              gridTemplateColumns: "1fr 80px 80px 56px",
              borderBottom: "1px solid var(--color-black-border)",
              background: "var(--color-black-elevated)",
            }}
          >
            <span>Student</span>
            <span className="text-center">Score / 100</span>
            <span className="text-center">GP</span>
            <span className="text-center">Grade</span>
          </div>

          {/* Student rows */}
          <div className="overflow-y-auto flex-1" style={{ maxHeight: "520px" }}>
            {studentsLoading ? (
              // Skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="px-5 py-4 flex items-center gap-4 animate-pulse border-b"
                  style={{ borderColor: "var(--color-black-border)" }}
                >
                  <div className="w-9 h-9 rounded-full shrink-0" style={{ background: "var(--color-black-elevated)" }} />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 rounded w-1/3" style={{ background: "var(--color-black-elevated)" }} />
                    <div className="h-2.5 rounded w-1/4" style={{ background: "var(--color-black-elevated)" }} />
                  </div>
                  <div className="h-9 w-20 rounded-xl" style={{ background: "var(--color-black-elevated)" }} />
                </div>
              ))
            ) : studentsError ? (
              <div className="px-5 py-12 text-center">
                <AlertCircle className="w-10 h-10 mx-auto mb-3" style={{ color: "#ef4444" }} />
                <p style={{ color: "var(--text-secondary)" }}>Failed to load students.</p>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="px-5 py-12 text-center">
                <Users className="w-10 h-10 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                <p style={{ color: "var(--text-secondary)" }}>
                  {totalStudents === 0
                    ? "No students have unlocked this week yet"
                    : "No students match your search"}
                </p>
              </div>
            ) : (
              filteredStudents.map((student, idx) => {
                const local = localScores[student.student_id] ?? { score: "", remarks: "" };
                const gradeInfo = getGradeInfo(local.score);
                const hasScore = local.score !== "";

                return (
                  <motion.div
                    key={student.student_id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.018, 0.25) }}
                    className="border-b"
                    style={{ borderColor: "var(--color-black-border)" }}
                  >
                    <div
                      className="px-5 py-3.5 grid items-center gap-3"
                      style={{ gridTemplateColumns: "1fr 80px 80px 56px" }}
                    >
                      {/* Student info */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 text-sm font-bold"
                          style={{ background: "#1ed76015", color: "#1ed760" }}
                        >
                          {student.first_name?.[0]?.toUpperCase() ?? "?"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate" style={{ color: "var(--text-primary)" }}>
                            {student.first_name} {student.last_name}
                          </p>
                          <p className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                            {student.email}
                          </p>
                        </div>
                      </div>

                      {/* Score input */}
                      <div className="flex justify-center">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.5"
                          value={local.score}
                          onChange={(e) =>
                            handleScoreChange(student.student_id, "score", e.target.value)
                          }
                          placeholder="—"
                          className="w-20 px-0 py-2 rounded-xl text-sm text-center font-bold outline-none"
                          style={{
                            background: "var(--color-black-elevated)",
                            border: `1px solid ${hasScore ? gradeInfo.color + "60" : "var(--color-black-border)"}`,
                            color: hasScore ? gradeInfo.color : "var(--text-muted)",
                          }}
                          // Tab through students
                          tabIndex={idx + 1}
                        />
                      </div>

                      {/* GP */}
                      <div className="text-center">
                        <span
                          className="text-sm font-bold"
                          style={{ color: hasScore ? gradeInfo.color : "var(--text-muted)" }}
                        >
                          {hasScore ? gradeInfo.gp.toFixed(1) : "—"}
                        </span>
                      </div>

                      {/* Grade badge */}
                      <div className="flex justify-center">
                        <span
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold"
                          style={{
                            background: gradeInfo.bg,
                            color: gradeInfo.color,
                          }}
                        >
                          {gradeInfo.grade}
                        </span>
                      </div>
                    </div>

                    {/* Remarks row (inline, optional) */}
                    {hasScore && (
                      <div className="px-5 pb-3">
                        <input
                          type="text"
                          value={local.remarks}
                          onChange={(e) =>
                            handleScoreChange(student.student_id, "remarks", e.target.value)
                          }
                          placeholder="Add remark (optional)…"
                          className="w-full px-3 py-1.5 rounded-lg text-xs outline-none"
                          style={{
                            background: "transparent",
                            border: "1px dashed var(--color-black-border)",
                            color: "var(--text-secondary)",
                          }}
                        />
                      </div>
                    )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Table footer: GP scale legend */}
          <div
            className="px-5 py-3 border-t flex flex-wrap gap-x-5 gap-y-1"
            style={{ borderColor: "var(--color-black-border)", background: "var(--color-black-elevated)" }}
          >
            <p className="w-full text-xs font-bold mb-1" style={{ color: "var(--text-muted)" }}>
              GP Scale
            </p>
            {[
              { range: "70–100", grade: "A", gp: "5.0", color: "#1ed760" },
              { range: "60–69", grade: "B", gp: "4.0", color: "#3b82f6" },
              { range: "50–59", grade: "C", gp: "3.0", color: "#a78bfa" },
              { range: "45–49", grade: "D", gp: "2.0", color: "#f59e0b" },
              { range: "40–44", grade: "E", gp: "1.0", color: "#f97316" },
              { range: "0–39", grade: "F", gp: "0.0", color: "#ef4444" },
            ].map(({ range, grade, gp, color }) => (
              <span key={grade} className="flex items-center gap-1 text-xs">
                <span className="font-bold" style={{ color }}>{grade}</span>
                <span style={{ color: "var(--text-muted)" }}>= {gp} ({range})</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
