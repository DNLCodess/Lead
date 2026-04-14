// app/profile/transcript/page.jsx
// Official Academic Transcript — LEAD 52-Week Leadership Development Program
//
// States:
//  • loading   — fetching data
//  • preview   — some weeks scored but < 52; document shown with blur overlay
//  • complete  — all 52 weeks scored; fully unlocked, print/download enabled
//
// Layout follows the Nigerian university transcript standard:
//   Letterhead → Student info → Academic record by phase → Cumulative summary
//   → Grading scale → Certification block
// Each week = 1 credit unit.  QP = GP × CU.  CGPA = Σ QP / Σ CU.

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Printer, ArrowLeft, Lock, GraduationCap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASES = [
  { label: "Foundations",       code: "I",   weeks: [1,  13] },
  { label: "Core Concepts",     code: "II",  weeks: [14, 26] },
  { label: "Advanced Practice", code: "III", weeks: [27, 39] },
  { label: "Mastery",           code: "IV",  weeks: [40, 52] },
];

// ─── Grade helpers (Nigerian 5-point scale) ───────────────────────────────────

function gradeInfo(score) {
  const n = parseFloat(score);
  if (n >= 70) return { grade: "A", gp: 5.0, label: "Excellent" };
  if (n >= 60) return { grade: "B", gp: 4.0, label: "Good" };
  if (n >= 50) return { grade: "C", gp: 3.0, label: "Average" };
  if (n >= 45) return { grade: "D", gp: 2.0, label: "Pass" };
  if (n >= 40) return { grade: "E", gp: 1.0, label: "Marginal" };
  return { grade: "F", gp: 0.0, label: "Fail" };
}

function degreeClass(cgpa) {
  const c = parseFloat(cgpa);
  if (c >= 4.50) return "First Class Distinction";
  if (c >= 3.50) return "Second Class Upper";
  if (c >= 2.40) return "Second Class Lower";
  if (c >= 1.50) return "Third Class";
  if (c >= 1.00) return "Pass";
  return "Fail";
}

// Zero-pad a week number to a 3-digit course code
const courseCode = (n) => `LEAD-${String(n).padStart(3, "0")}`;

// Short transcript reference derived from student UUID
const transcriptRef = (id) =>
  `TXN-${(id ?? "").replace(/-/g, "").slice(0, 8).toUpperCase()}`;

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "var(--text-muted)" }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>
        {value || "—"}
      </p>
    </div>
  );
}

function PhaseTable({ phase, scores, weekTitles, runningCgpa }) {
  const weekRange = Array.from(
    { length: phase.weeks[1] - phase.weeks[0] + 1 },
    (_, i) => phase.weeks[0] + i,
  );

  const phaseRows = weekRange
    .map((w) => ({ week: w, row: scores.find((s) => s.week_number === w) }))
    .filter(({ row }) => !!row);

  const totalCU = phaseRows.length; // each week = 1 CU
  const totalQP = phaseRows.reduce((acc, { row }) => acc + parseFloat(row.grade_point), 0);
  const phaseGPA = totalCU > 0 ? (totalQP / totalCU).toFixed(2) : "—";

  // col widths
  const cols = "56px 80px 1fr 52px 48px 36px 44px 44px";

  const headerCell = (txt, center = false) => (
    <span
      key={txt}
      className={`text-[10px] font-bold uppercase tracking-wider ${center ? "text-center" : ""}`}
      style={{ color: "var(--text-muted)" }}
    >
      {txt}
    </span>
  );

  return (
    <div className="mb-6">
      {/* Phase heading */}
      <div className="flex items-baseline gap-3 mb-2">
        <h3 className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
          Phase {phase.code} — {phase.label}
        </h3>
        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
          Weeks {phase.weeks[0]}–{phase.weeks[1]} · {phase.weeks[1] - phase.weeks[0] + 1} credit units
        </span>
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ border: "1px solid var(--color-black-border)" }}
      >
        {/* Column headers */}
        <div
          className="grid px-4 py-2 gap-2"
          style={{
            gridTemplateColumns: cols,
            background: "var(--color-black-elevated)",
            borderBottom: "1px solid var(--color-black-border)",
          }}
        >
          {headerCell("Week")}
          {headerCell("Code")}
          {headerCell("Course Title")}
          {headerCell("Score", true)}
          {headerCell("CU", true)}
          {headerCell("Grd", true)}
          {headerCell("GP", true)}
          {headerCell("QP", true)}
        </div>

        {/* Data rows */}
        {weekRange.map((weekNum, idx) => {
          const scoreRow = scores.find((s) => s.week_number === weekNum);
          const gi = scoreRow ? gradeInfo(scoreRow.score) : null;
          const isEmpty = !scoreRow;

          return (
            <div
              key={weekNum}
              className="grid px-4 py-2.5 gap-2 items-center text-sm"
              style={{
                gridTemplateColumns: cols,
                borderTop: idx > 0 ? "1px solid var(--color-black-border)" : undefined,
                background:
                  isEmpty
                    ? "rgba(255,255,255,0.01)"
                    : idx % 2 === 0
                      ? "transparent"
                      : "rgba(255,255,255,0.018)",
                opacity: isEmpty ? 0.35 : 1,
              }}
            >
              <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{weekNum}</span>
              <span style={{ color: "var(--text-muted)", fontSize: "0.7rem", fontFamily: "monospace" }}>
                {courseCode(weekNum)}
              </span>
              <span className="truncate pr-1" style={{ color: "var(--text-primary)", fontSize: "0.78rem" }}>
                {weekTitles[weekNum] ?? `Week ${weekNum} Lesson`}
              </span>
              <span
                className="text-center font-semibold text-xs"
                style={{ color: gi ? gi.grade === "F" ? "#ef4444" : "var(--text-primary)" : "var(--text-muted)" }}
              >
                {scoreRow ? `${parseFloat(scoreRow.score).toFixed(1)}%` : "—"}
              </span>
              <span className="text-center text-xs" style={{ color: "var(--text-muted)" }}>1</span>
              <span
                className="text-center font-bold text-xs"
                style={{ color: gi ? gi.gp >= 4 ? "#1ed760" : gi.gp >= 3 ? "#3b82f6" : gi.gp >= 2 ? "#f59e0b" : "#ef4444" : "var(--text-muted)" }}
              >
                {gi ? gi.grade : "—"}
              </span>
              <span className="text-center text-xs" style={{ color: "var(--text-primary)" }}>
                {gi ? gi.gp.toFixed(1) : "—"}
              </span>
              <span className="text-center text-xs" style={{ color: "var(--text-muted)" }}>
                {gi ? gi.gp.toFixed(1) : "—"}
              </span>
            </div>
          );
        })}

        {/* Phase subtotal row */}
        <div
          className="grid px-4 py-2.5 gap-2 items-center text-xs font-bold"
          style={{
            gridTemplateColumns: cols,
            background: "var(--color-black-elevated)",
            borderTop: "1px solid var(--color-black-border)",
            color: "var(--text-secondary)",
          }}
        >
          <span className="col-span-2 text-xs" style={{ color: "var(--text-muted)" }}>Phase Totals</span>
          <span />
          <span />
          <span className="text-center">{totalCU}</span>
          <span />
          <span className="text-center" style={{ color: "#1ed760" }}>{phaseGPA}</span>
          <span className="text-center">{totalQP.toFixed(1)}</span>
        </div>
      </div>

      {/* Phase summary line */}
      <div className="flex items-center gap-6 mt-2 px-1 text-xs" style={{ color: "var(--text-muted)" }}>
        <span>
          Phase GPA: <strong style={{ color: "var(--text-primary)" }}>{phaseGPA}</strong>
        </span>
        <span>
          Total QP: <strong style={{ color: "var(--text-primary)" }}>{totalQP.toFixed(1)}</strong>
        </span>
        {runningCgpa !== null && (
          <span>
            Cumulative CGPA after Phase {phase.code}:{" "}
            <strong style={{ color: "#1ed760" }}>{runningCgpa}</strong>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TranscriptPage() {
  const router = useRouter();
  const [state, setState] = useState("loading"); // loading | preview | complete
  const [student, setStudent] = useState(null);
  const [scores, setScores] = useState([]);
  const [weekTitles, setWeekTitles] = useState({});
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data: { user }, error: authErr } = await supabase.auth.getUser();
        if (authErr || !user) { router.push("/auth/login"); return; }

        const [studentRes, scoresRes, titlesRes] = await Promise.all([
          supabase
            .from("students")
            .select("id, first_name, last_name, email, country, city, account_type, created_at")
            .eq("user_id", user.id)
            .maybeSingle(),
          supabase
            .from("week_scores")
            .select("week_number, score, grade, grade_point, remarks, updated_at")
            .eq("user_id", user.id)
            .order("week_number"),
          supabase
            .from("week_content")
            .select("week_number, title"),
        ]);

        if (studentRes.error) throw studentRes.error;
        if (!studentRes.data) { router.push("/profile"); return; }

        const titles = {};
        (titlesRes.data ?? []).forEach((w) => { titles[w.week_number] = w.title; });

        setStudent({ ...studentRes.data, user_id: user.id });
        setScores(scoresRes.data ?? []);
        setWeekTitles(titles);
        setState((scoresRes.data ?? []).length >= 52 ? "complete" : "preview");
      } catch (err) {
        setFetchError(err.message);
        setState("preview"); // show error within preview shell
      }
    };
    load();
  }, [router]);

  // ── Computed values ──────────────────────────────────────────────────────────
  const cgpa = useMemo(() => {
    if (!scores.length) return "0.00";
    const total = scores.reduce((acc, s) => acc + parseFloat(s.grade_point), 0);
    return (total / scores.length).toFixed(2);
  }, [scores]);

  const totalQP = useMemo(
    () => scores.reduce((acc, s) => acc + parseFloat(s.grade_point), 0),
    [scores],
  );

  const avgScore = useMemo(() => {
    if (!scores.length) return "0.0";
    return (scores.reduce((a, s) => a + parseFloat(s.score), 0) / scores.length).toFixed(1);
  }, [scores]);

  // Running CGPA after each phase
  const runningCgpa = useMemo(() => {
    const result = {};
    let cumulativeQP = 0;
    let cumulativeCU = 0;
    PHASES.forEach((phase) => {
      const phaseScores = scores.filter(
        (s) => s.week_number >= phase.weeks[0] && s.week_number <= phase.weeks[1],
      );
      phaseScores.forEach((s) => {
        cumulativeQP += parseFloat(s.grade_point);
        cumulativeCU += 1;
      });
      result[phase.code] = cumulativeCU > 0
        ? (cumulativeQP / cumulativeCU).toFixed(2)
        : null;
    });
    return result;
  }, [scores]);

  const isComplete = state === "complete";
  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const txRef = transcriptRef(student?.id);

  // ── Loading ──────────────────────────────────────────────────────────────────
  if (state === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="text-center">
          <div
            className="w-12 h-12 border-4 rounded-full mx-auto mb-4 animate-spin"
            style={{ borderColor: "var(--color-black-border)", borderTopColor: "#1ed760" }}
          />
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            Loading transcript…
          </p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────────
  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "var(--background)" }}>
        <div className="text-center max-w-sm">
          <p className="text-sm mb-4" style={{ color: "#ef4444" }}>
            Could not load transcript: {fetchError}
          </p>
          <button
            onClick={() => router.push("/profile?tab=scores")}
            className="px-4 py-2 rounded-xl text-sm font-semibold"
            style={{ background: "var(--color-green-primary)", color: "#000" }}
          >
            Back to Scores
          </button>
        </div>
      </div>
    );
  }

  // ── Transcript document (shared between preview and complete) ────────────────
  const TranscriptDocument = (
    <div
      id="transcript-document"
      className="bg-white text-gray-900 rounded-2xl print:rounded-none shadow-2xl print:shadow-none"
      style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
    >
      {/* ── 1. Letterhead ──────────────────────────────────────────────────────── */}
      <div
        className="px-10 pt-10 pb-6"
        style={{
          background: "linear-gradient(135deg, #0a1a0f 0%, #0d2415 100%)",
          borderRadius: "16px 16px 0 0",
        }}
      >
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Logo + institution name */}
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <Image
                src="/logo-white.png"
                alt="LEAD Academy logo"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#ffffff" }}>
                LEAD Academy
              </h1>
              <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
                52-Week Leadership Development Program
              </p>
              <div
                className="mt-2 h-px"
                style={{ background: "linear-gradient(90deg, #1ed760, transparent)", width: "180px" }}
              />
            </div>
          </div>

          {/* Document title block */}
          <div className="text-right">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-1"
              style={{ color: "#1ed760" }}
            >
              Official Document
            </p>
            <p
              className="text-xl font-bold uppercase tracking-wide"
              style={{ color: "#ffffff", letterSpacing: "0.06em" }}
            >
              Academic Transcript
            </p>
            {!isComplete && (
              <span
                className="inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
                style={{ background: "rgba(245,158,11,0.2)", color: "#f59e0b" }}
              >
                Preview — Incomplete
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── 2. Student information + document metadata ─────────────────────────── */}
      <div
        className="grid grid-cols-2 gap-6 px-10 py-6"
        style={{ borderBottom: "1px solid #e5e7eb" }}
      >
        {/* Left: student details */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>
            Student Information
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <DataRow label="Full Name" value={`${student?.first_name} ${student?.last_name}`} />
            <DataRow label="Email Address" value={student?.email} />
            <DataRow
              label="Account Type"
              value={student?.account_type === "nigerian" ? "Nigerian" : "International"}
            />
            <DataRow label="Country" value={student?.country} />
            <DataRow
              label="Date of Enrollment"
              value={
                student?.created_at
                  ? new Date(student.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })
                  : "—"
              }
            />
            <DataRow label="Program" value="52-Week Leadership Development" />
          </div>
        </div>

        {/* Right: document metadata */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#6b7280" }}>
            Document Information
          </p>
          <div className="grid grid-cols-1 gap-y-3">
            <DataRow label="Transcript Reference" value={txRef} />
            <DataRow label="Date of Issue" value={issueDate} />
            <DataRow
              label="Document Status"
              value={isComplete ? "Official — Complete" : "Preview — In Progress"}
            />
            <DataRow label="Total Credit Units" value="52" />
          </div>
        </div>
      </div>

      {/* ── 3. Academic record ─────────────────────────────────────────────────── */}
      <div className="px-10 py-6">
        <p
          className="text-xs font-bold uppercase tracking-widest mb-5"
          style={{ color: "#6b7280", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}
        >
          Academic Performance Record
        </p>

        {PHASES.map((phase) => (
          <PhaseTable
            key={phase.code}
            phase={phase}
            scores={scores}
            weekTitles={weekTitles}
            runningCgpa={runningCgpa[phase.code]}
          />
        ))}
      </div>

      {/* ── 4. Cumulative summary ─────────────────────────────────────────────── */}
      <div
        className="mx-10 mb-6 rounded-xl overflow-hidden"
        style={{ border: "1px solid #d1fae5", background: "#f0fdf4" }}
      >
        <div
          className="px-6 py-3"
          style={{ background: "#dcfce7", borderBottom: "1px solid #d1fae5" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#166534" }}>
            Cumulative Summary
          </p>
        </div>
        <div className="px-6 py-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: "Total Credit Units",   value: scores.length },
            { label: "Total Quality Points", value: totalQP.toFixed(1) },
            { label: "CGPA (5.0 Scale)",     value: cgpa },
            { label: "Class of Degree",      value: isComplete ? degreeClass(cgpa) : "Pending" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <p
                className="text-2xl font-bold"
                style={{ color: "#166534", fontVariantNumeric: "tabular-nums" }}
              >
                {value}
              </p>
              <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#6b7280" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── 5. Grading scale reference ────────────────────────────────────────── */}
      <div
        className="mx-10 mb-6 rounded-xl p-5"
        style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
          Grading Scale — Nigerian 5-Point System
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr style={{ background: "#f3f4f6" }}>
                {["Score Range", "Grade", "Grade Point", "Quality Point (per unit)", "Description"].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-left font-bold uppercase tracking-wider"
                    style={{ color: "#6b7280", borderBottom: "1px solid #e5e7eb", fontSize: "0.65rem" }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ["70 – 100%", "A", "5.0", "5.0", "Excellent"],
                ["60 – 69%",  "B", "4.0", "4.0", "Good"],
                ["50 – 59%",  "C", "3.0", "3.0", "Average"],
                ["45 – 49%",  "D", "2.0", "2.0", "Pass"],
                ["40 – 44%",  "E", "1.0", "1.0", "Marginal"],
                ["0  – 39%",  "F", "0.0", "0.0", "Fail"],
              ].map(([range, grade, gp, qp, desc], i) => (
                <tr
                  key={grade}
                  style={{ background: i % 2 === 0 ? "#ffffff" : "#f9fafb" }}
                >
                  <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{range}</td>
                  <td className="px-3 py-1.5 font-bold" style={{ color: "#166534", borderBottom: "1px solid #f3f4f6" }}>{grade}</td>
                  <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{gp}</td>
                  <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{qp}</td>
                  <td className="px-3 py-1.5" style={{ color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] mt-3" style={{ color: "#9ca3af" }}>
          CGPA Formula: Σ (Grade Point × Credit Unit) ÷ Σ Credit Units.
          Each week = 1 credit unit. CGPA is calculated over all scored weeks.
        </p>
      </div>

      {/* ── 6. Certification block ────────────────────────────────────────────── */}
      <div
        className="mx-10 mb-10 rounded-xl p-6"
        style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
      >
        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
          Certification
        </p>
        <p className="text-sm leading-relaxed mb-6" style={{ color: "#374151" }}>
          This is to certify that the academic record presented above is the
          official performance record of{" "}
          <strong>{student?.first_name} {student?.last_name}</strong> in the
          52-Week Leadership Development Program at LEAD Academy.{" "}
          {isComplete
            ? "The student has successfully completed all 52 weeks of the programme."
            : "This document is a preview; completion of all 52 weeks is required for an official transcript."}
        </p>

        <div className="flex justify-between items-end flex-wrap gap-8">
          <div>
            <div style={{ borderBottom: "1px solid #d1d5db", width: "180px", marginBottom: "4px" }} />
            <p className="text-sm font-bold" style={{ color: "#111827" }}>
              {student?.first_name} {student?.last_name}
            </p>
            <p className="text-xs" style={{ color: "#6b7280" }}>Student Signature</p>
          </div>

          <div className="text-right">
            <div style={{ borderBottom: "1px solid #d1d5db", width: "180px", marginBottom: "4px", marginLeft: "auto" }} />
            <p className="text-sm font-bold" style={{ color: "#111827" }}>Lead Administrator</p>
            <p className="text-xs" style={{ color: "#6b7280" }}>LEAD Academy · {issueDate}</p>
          </div>
        </div>

        {/* Document number + verification note */}
        <div
          className="mt-6 pt-4 flex items-center justify-between flex-wrap gap-2 text-[10px]"
          style={{ borderTop: "1px dashed #d1d5db", color: "#9ca3af" }}
        >
          <span>Document Ref: <strong style={{ color: "#6b7280" }}>{txRef}</strong></span>
          <span>
            {isComplete
              ? "This document is official when printed or saved as PDF from the LEAD Academy student portal."
              : "PREVIEW ONLY — Not an official document until all 52 weeks are complete."}
          </span>
        </div>
      </div>
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Screen toolbar — hidden when printing */}
      <div
        className="print:hidden sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b"
        style={{
          background: "var(--color-black-surface)",
          borderColor: "var(--color-black-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <button
          onClick={() => router.push("/profile?tab=scores")}
          className="flex items-center gap-2 text-sm font-semibold transition-colors hover:opacity-75"
          style={{ color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Scores
        </button>

        <div className="flex items-center gap-3">
          {!isComplete && (
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full"
              style={{ background: "rgba(245,158,11,0.12)", color: "#f59e0b" }}
            >
              {scores.length}/52 weeks scored — preview only
            </span>
          )}

          {isComplete ? (
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
              style={{ background: "#1ed760", color: "#000" }}
            >
              <Printer className="w-4 h-4" />
              Save as PDF / Print
            </button>
          ) : (
            <button
              disabled
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm opacity-40 cursor-not-allowed"
              style={{ background: "var(--color-black-elevated)", color: "var(--text-muted)" }}
              title="Complete all 52 weeks to unlock print"
            >
              <Lock className="w-4 h-4" />
              Print Locked
            </button>
          )}
        </div>
      </div>

      {/* Document wrapper */}
      <div
        className="min-h-screen py-10 px-4 print:p-0 print:bg-white"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto print:max-w-none relative">

          {/* ── Document ──────────────────────────────────────────────────── */}
          {TranscriptDocument}

          {/* ── Preview blur overlay (incomplete only) ──────────────────── */}
          {!isComplete && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="print:hidden absolute inset-x-0 rounded-2xl overflow-hidden pointer-events-none"
                style={{
                  /* Start blurring roughly after phase 1 table */
                  top: "540px",
                  bottom: 0,
                }}
              >
                {/* Gradient fade-in from transparent → blurred */}
                <div
                  className="absolute inset-x-0 top-0 h-32"
                  style={{
                    background: "linear-gradient(to bottom, transparent, rgba(10,13,18,0.85))",
                  }}
                />
                {/* Solid blur panel */}
                <div
                  className="absolute inset-x-0"
                  style={{
                    top: "128px",
                    bottom: 0,
                    background: "rgba(10,13,18,0.92)",
                    backdropFilter: "blur(6px)",
                  }}
                />
              </motion.div>
            </AnimatePresence>
          )}

          {/* ── Lock badge (incomplete only) ────────────────────────────── */}
          {!isComplete && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="print:hidden absolute inset-x-0 flex justify-center pointer-events-auto"
              style={{ top: "680px" }}
            >
              <div
                className="mx-4 rounded-2xl p-8 text-center max-w-md w-full"
                style={{
                  background: "var(--color-black-surface)",
                  border: "1px solid var(--color-black-border)",
                  boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
                }}
              >
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{ background: "rgba(30,215,96,0.1)", border: "1px solid rgba(30,215,96,0.2)" }}
                >
                  <GraduationCap className="w-8 h-8" style={{ color: "#1ed760" }} />
                </div>

                <h3
                  className="text-xl font-bold mb-2"
                  style={{ color: "var(--text-primary)", fontFamily: "var(--font-satoshi)" }}
                >
                  Transcript Locked
                </h3>
                <p className="text-sm mb-5" style={{ color: "var(--text-secondary)", lineHeight: "1.6" }}>
                  The rest of your transcript is hidden until all 52 weeks are
                  scored. You&apos;ve completed{" "}
                  <strong style={{ color: "#1ed760" }}>{scores.length}</strong> of 52 weeks so far.
                </p>

                {/* Progress bar */}
                <div
                  className="h-2 rounded-full overflow-hidden mb-5"
                  style={{ background: "var(--color-black-elevated)" }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(scores.length / 52) * 100}%` }}
                    transition={{ duration: 1.2, ease: "easeOut" }}
                    className="h-full rounded-full"
                    style={{ background: "linear-gradient(90deg, #1ed760, #16b455)" }}
                  />
                </div>

                <p className="text-xs mb-5" style={{ color: "var(--text-muted)" }}>
                  {52 - scores.length} more week{52 - scores.length !== 1 ? "s" : ""} until your official transcript is ready
                </p>

                <button
                  onClick={() => router.push("/profile?tab=scores")}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
                  style={{ background: "#1ed760", color: "#000" }}
                >
                  View My Scores
                </button>
              </div>
            </motion.div>
          )}

          {/* Extra space so lock card doesn't overlap page footer */}
          {!isComplete && <div className="print:hidden h-96" />}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #fff !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          @page { margin: 1.2cm; size: A4 portrait; }
        }
      `}</style>
    </>
  );
}
