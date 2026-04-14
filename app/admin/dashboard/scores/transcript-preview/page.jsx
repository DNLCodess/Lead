// app/admin/dashboard/scores/transcript-preview/page.jsx
// Admin-only: shows exactly what a completed student transcript looks like,
// filled with realistic sample data. No database reads — purely presentational.

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Printer, FlaskConical } from "lucide-react";

// ─── Grade helpers (Nigerian 5-point scale) ───────────────────────────────────
function gi(score) {
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
const code = (n) => `LEAD-${String(n).padStart(3, "0")}`;

// ─── SAMPLE PROFILES ─────────────────────────────────────────────────────────
// Three profiles the admin can toggle between to see different transcript outcomes

const WEEK_TITLES = [
  null, // 1-based index; slot 0 unused
  "Introduction to Leadership",
  "Self-Awareness & Emotional Intelligence",
  "Communication Fundamentals",
  "Goal Setting & Vision",
  "Time Management & Productivity",
  "Decision Making Frameworks",
  "Team Dynamics & Group Psychology",
  "Conflict Resolution",
  "Active Listening & Empathy",
  "Personal Branding",
  "Critical Thinking",
  "Resilience & Adaptability",
  "Phase I Assessment & Review",
  "Strategic Thinking",
  "Organisational Behaviour",
  "Delegation & Empowerment",
  "Coaching & Mentoring",
  "Change Management",
  "Stakeholder Management",
  "Data-Driven Decision Making",
  "Project Management Essentials",
  "Financial Literacy for Leaders",
  "Negotiation Skills",
  "Public Speaking & Presentation",
  "Building High-Performance Teams",
  "Phase II Mid-Programme Review",
  "Advanced Communication",
  "Systems Thinking",
  "Innovation & Creativity",
  "Risk Management",
  "Cross-Cultural Leadership",
  "Ethical Leadership",
  "Influence & Persuasion",
  "Crisis Leadership",
  "Digital Leadership",
  "Talent Development",
  "Organisational Strategy",
  "Executive Presence",
  "Phase III Performance Review",
  "Leadership Legacy",
  "Succession Planning",
  "Visionary Leadership",
  "Building a Learning Organisation",
  "Leading Through Uncertainty",
  "Social Impact & Leadership",
  "Advanced Negotiation",
  "Building Networks & Alliances",
  "Leading Large Organisations",
  "Leadership in the Digital Age",
  "Personal Leadership Mastery",
  "Capstone Leadership Project",
  "Programme Completion & Graduation",
];

const PROFILES = {
  first_class: {
    label: "First Class",
    color: "#1ed760",
    student: {
      first_name: "Chisom",
      last_name: "Okonkwo",
      email: "chisom.okonkwo@example.com",
      account_type: "nigerian",
      country: "Nigeria",
      city: "Lagos",
      enrolled: "January 15, 2024",
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    // scores that produce a First Class trajectory
    scores: [
      82,78,85,71,88,74,79,83,76,90,72,87,81,
      68,73,65,70,75,62,78,71,66,74,80,69,77,
      83,76,88,72,79,85,91,74,82,78,86,80,89,
      92,87,94,88,91,85,90,86,93,88,95,91,97,
    ],
  },
  second_upper: {
    label: "2nd Class Upper",
    color: "#3b82f6",
    student: {
      first_name: "Emeka",
      last_name: "Adeyemi",
      email: "emeka.adeyemi@example.com",
      account_type: "nigerian",
      country: "Nigeria",
      city: "Abuja",
      enrolled: "March 3, 2024",
      id: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    scores: [
      72,65,70,68,74,60,67,71,63,75,66,70,68,
      62,65,60,64,67,58,70,63,61,65,68,60,66,
      72,67,75,63,69,73,80,65,71,68,75,70,78,
      81,76,83,78,80,74,79,75,82,78,84,80,85,
    ],
  },
  second_lower: {
    label: "2nd Class Lower",
    color: "#f59e0b",
    student: {
      first_name: "Ngozi",
      last_name: "Nwachukwu",
      email: "ngozi.nwachukwu@example.com",
      account_type: "international",
      country: "Ghana",
      city: "Accra",
      enrolled: "June 10, 2024",
      id: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    },
    scores: [
      60,55,58,52,62,50,56,60,53,64,51,59,57,
      50,54,48,52,56,46,60,53,49,55,58,47,53,
      62,57,65,53,59,63,70,55,61,58,65,60,68,
      70,66,72,68,70,64,68,65,71,67,73,69,74,
    ],
  },
};

const PHASES = [
  { label: "Foundations",       code: "I",   weeks: [1,  13] },
  { label: "Core Concepts",     code: "II",  weeks: [14, 26] },
  { label: "Advanced Practice", code: "III", weeks: [27, 39] },
  { label: "Mastery",           code: "IV",  weeks: [40, 52] },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function DataRow({ label, value }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "#9ca3af" }}>
        {label}
      </p>
      <p className="text-sm font-semibold mt-0.5" style={{ color: "#111827" }}>
        {value || "—"}
      </p>
    </div>
  );
}

function PhaseTable({ phase, scores, runningCgpa }) {
  const weekRange = Array.from(
    { length: phase.weeks[1] - phase.weeks[0] + 1 },
    (_, i) => phase.weeks[0] + i,
  );

  const totalCU = weekRange.length;
  const totalQP = weekRange.reduce((acc, w) => {
    const s = scores[w - 1];
    return acc + gi(s).gp;
  }, 0);
  const phaseGPA = (totalQP / totalCU).toFixed(2);

  const cols = "56px 80px 1fr 52px 48px 36px 44px 44px";

  return (
    <div className="mb-6">
      <div className="flex items-baseline gap-3 mb-2">
        <h3 className="font-bold text-sm" style={{ color: "#111827" }}>
          Phase {phase.code} — {phase.label}
        </h3>
        <span className="text-xs" style={{ color: "#6b7280" }}>
          Weeks {phase.weeks[0]}–{phase.weeks[1]} · {totalCU} credit units
        </span>
      </div>

      <div className="rounded-xl overflow-hidden" style={{ border: "1px solid #e5e7eb" }}>
        {/* Header */}
        <div
          className="grid px-4 py-2 gap-2"
          style={{ gridTemplateColumns: cols, background: "#f3f4f6", borderBottom: "1px solid #e5e7eb" }}
        >
          {["Week", "Code", "Course Title", "Score", "CU", "Grd", "GP", "QP"].map((h, i) => (
            <span
              key={h}
              className={`text-[10px] font-bold uppercase tracking-wider ${i >= 3 ? "text-center" : ""}`}
              style={{ color: "#6b7280" }}
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {weekRange.map((weekNum, idx) => {
          const score = scores[weekNum - 1];
          const info = gi(score);
          const gpColor = info.gp >= 4 ? "#166534" : info.gp >= 3 ? "#1d4ed8" : info.gp >= 2 ? "#92400e" : "#991b1b";

          return (
            <div
              key={weekNum}
              className="grid px-4 py-2 gap-2 items-center"
              style={{
                gridTemplateColumns: cols,
                borderTop: idx > 0 ? "1px solid #f3f4f6" : undefined,
                background: idx % 2 === 0 ? "#ffffff" : "#fafafa",
              }}
            >
              <span className="text-xs" style={{ color: "#9ca3af" }}>{weekNum}</span>
              <span className="text-[11px] font-mono" style={{ color: "#9ca3af" }}>{code(weekNum)}</span>
              <span className="text-xs truncate pr-1" style={{ color: "#374151" }}>
                {WEEK_TITLES[weekNum]}
              </span>
              <span className="text-center text-xs font-semibold" style={{ color: "#374151" }}>
                {score.toFixed(1)}%
              </span>
              <span className="text-center text-xs" style={{ color: "#9ca3af" }}>1</span>
              <span className="text-center text-xs font-bold" style={{ color: gpColor }}>
                {info.grade}
              </span>
              <span className="text-center text-xs" style={{ color: "#374151" }}>
                {info.gp.toFixed(1)}
              </span>
              <span className="text-center text-xs" style={{ color: "#6b7280" }}>
                {info.gp.toFixed(1)}
              </span>
            </div>
          );
        })}

        {/* Phase subtotal */}
        <div
          className="grid px-4 py-2 gap-2 items-center text-xs font-bold"
          style={{
            gridTemplateColumns: cols,
            background: "#f3f4f6",
            borderTop: "1px solid #e5e7eb",
            color: "#6b7280",
          }}
        >
          <span className="col-span-2">Phase Totals</span>
          <span />
          <span />
          <span className="text-center">{totalCU}</span>
          <span />
          <span className="text-center" style={{ color: "#166534" }}>{phaseGPA}</span>
          <span className="text-center">{totalQP.toFixed(1)}</span>
        </div>
      </div>

      <div className="flex items-center gap-6 mt-2 px-1 text-xs" style={{ color: "#9ca3af" }}>
        <span>Phase GPA: <strong style={{ color: "#374151" }}>{phaseGPA}</strong></span>
        <span>Total QP: <strong style={{ color: "#374151" }}>{totalQP.toFixed(1)}</strong></span>
        {runningCgpa && (
          <span>Cumulative CGPA: <strong style={{ color: "#166534" }}>{runningCgpa}</strong></span>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function TranscriptPreviewPage() {
  const router = useRouter();
  const [profileKey, setProfileKey] = useState("first_class");
  const profile = PROFILES[profileKey];
  const { student, scores } = profile;

  // Derived stats
  const totalQP = scores.reduce((acc, s) => acc + gi(s).gp, 0);
  const cgpa = (totalQP / 52).toFixed(2);
  const avgScore = (scores.reduce((a, s) => a + s, 0) / 52).toFixed(1);
  const degClass = degreeClass(cgpa);

  // Running CGPA per phase
  const runningCgpa = (() => {
    const result = {};
    let cumQP = 0, cumCU = 0;
    PHASES.forEach((ph) => {
      const phScores = scores.slice(ph.weeks[0] - 1, ph.weeks[1]);
      phScores.forEach((s) => { cumQP += gi(s).gp; cumCU += 1; });
      result[ph.code] = (cumQP / cumCU).toFixed(2);
    });
    return result;
  })();

  const issueDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "long", year: "numeric",
  });
  const txRef = `TXN-${student.id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;

  return (
    <>
      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <div
        className="print:hidden sticky top-0 z-50 flex items-center justify-between px-6 py-4 border-b flex-wrap gap-3"
        style={{
          background: "var(--color-black-surface)",
          borderColor: "var(--color-black-border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push("/admin/dashboard/scores")}
            className="flex items-center gap-2 text-sm font-semibold"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Scores
          </button>

          {/* Sample data notice */}
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold"
            style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", border: "1px solid rgba(245,158,11,0.2)" }}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Sample data only — not a real student record
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Profile switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl" style={{ background: "var(--color-black-elevated)" }}>
            {Object.entries(PROFILES).map(([key, p]) => (
              <button
                key={key}
                onClick={() => setProfileKey(key)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
                style={{
                  background: profileKey === key ? p.color : "transparent",
                  color: profileKey === key ? "#000" : "var(--text-muted)",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all hover:scale-105"
            style={{ background: "#1ed760", color: "#000" }}
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>
      </div>

      {/* ── Document wrapper ─────────────────────────────────────────────────── */}
      <div
        className="min-h-screen py-10 px-4 print:p-0 print:bg-white"
        style={{ background: "var(--background)" }}
      >
        <div className="max-w-4xl mx-auto print:max-w-none">

          {/* Sample data banner */}
          <motion.div
            key={profileKey}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="print:hidden mb-6 rounded-2xl px-6 py-4 flex items-center gap-4"
            style={{
              background: `${profile.color}10`,
              border: `1px solid ${profile.color}30`,
            }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg"
              style={{ background: `${profile.color}20`, color: profile.color }}
            >
              {student.first_name[0]}
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>
                Preview: {profile.label} Student — {student.first_name} {student.last_name}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                CGPA {cgpa} · Avg {avgScore}% · {degClass}
                &nbsp;·&nbsp;Switch profiles using the buttons above to see different outcomes.
              </p>
            </div>
          </motion.div>

          {/* ── TRANSCRIPT DOCUMENT ──────────────────────────────────────────── */}
          <motion.div
            key={profileKey + "-doc"}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl print:rounded-none shadow-2xl print:shadow-none overflow-hidden"
            style={{ fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif" }}
          >
            {/* ── 1. Letterhead ───────────────────────────────────────────── */}
            <div
              className="px-10 pt-10 pb-6"
              style={{ background: "linear-gradient(135deg, #0a1a0f 0%, #0d2415 100%)" }}
            >
              <div className="flex items-start justify-between gap-6 flex-wrap">
                <div className="flex items-center gap-4">
                  <div className="relative w-16 h-16 shrink-0">
                    <Image
                      src="/logo-white.png"
                      alt="LEAD Academy"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold tracking-tight" style={{ color: "#fff" }}>
                      LEAD Academy
                    </h1>
                    <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.5)" }}>
                      52-Week Leadership Development Program
                    </p>
                    <div
                      className="mt-2 h-px"
                      style={{ background: "linear-gradient(90deg,#1ed760,transparent)", width: "180px" }}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: "#1ed760" }}
                  >
                    Official Document
                  </p>
                  <p
                    className="text-xl font-bold uppercase tracking-wide"
                    style={{ color: "#fff", letterSpacing: "0.06em" }}
                  >
                    Academic Transcript
                  </p>
                  <p
                    className="mt-1 text-xs"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {issueDate}
                  </p>
                </div>
              </div>
            </div>

            {/* ── 2. Student info + Document metadata ─────────────────────── */}
            <div
              className="grid grid-cols-2 gap-6 px-10 py-6"
              style={{ borderBottom: "1px solid #e5e7eb" }}
            >
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
                  Student Information
                </p>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                  <DataRow label="Full Name" value={`${student.first_name} ${student.last_name}`} />
                  <DataRow label="Email Address" value={student.email} />
                  <DataRow label="Account Type" value={student.account_type === "nigerian" ? "Nigerian" : "International"} />
                  <DataRow label="Country" value={student.country} />
                  <DataRow label="Date of Enrollment" value={student.enrolled} />
                  <DataRow label="Programme" value="52-Week Leadership Development" />
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
                  Document Information
                </p>
                <div className="grid grid-cols-1 gap-y-3">
                  <DataRow label="Transcript Reference" value={txRef} />
                  <DataRow label="Date of Issue" value={issueDate} />
                  <DataRow label="Document Status" value="Official — Complete" />
                  <DataRow label="Total Credit Units" value="52" />
                </div>
              </div>
            </div>

            {/* ── 3. Academic record ──────────────────────────────────────── */}
            <div className="px-10 py-6">
              <p
                className="text-xs font-bold uppercase tracking-widest mb-5"
                style={{ color: "#9ca3af", borderBottom: "1px solid #e5e7eb", paddingBottom: "8px" }}
              >
                Academic Performance Record
              </p>

              {PHASES.map((ph) => (
                <PhaseTable
                  key={ph.code}
                  phase={ph}
                  scores={scores}
                  runningCgpa={runningCgpa[ph.code]}
                />
              ))}
            </div>

            {/* ── 4. Cumulative summary ────────────────────────────────────── */}
            <div
              className="mx-10 mb-6 rounded-xl overflow-hidden"
              style={{ border: "1px solid #d1fae5", background: "#f0fdf4" }}
            >
              <div className="px-6 py-3" style={{ background: "#dcfce7", borderBottom: "1px solid #d1fae5" }}>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "#166534" }}>
                  Cumulative Summary
                </p>
              </div>
              <div className="px-6 py-4 grid grid-cols-4 gap-4">
                {[
                  { label: "Total Credit Units",   value: "52" },
                  { label: "Total Quality Points", value: totalQP.toFixed(1) },
                  { label: "CGPA (5.0 Scale)",     value: cgpa },
                  { label: "Class of Degree",      value: degClass },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center">
                    <p className="text-2xl font-bold" style={{ color: "#166534" }}>{value}</p>
                    <p className="text-[10px] uppercase tracking-wider mt-0.5" style={{ color: "#6b7280" }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── 5. Grading scale ────────────────────────────────────────── */}
            <div
              className="mx-10 mb-6 rounded-xl p-5"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
                Grading Scale — Nigerian 5-Point System
              </p>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ background: "#f3f4f6" }}>
                    {["Score Range", "Grade", "Grade Point", "QP (per unit)", "Description"].map((h) => (
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
                    <tr key={grade} style={{ background: i % 2 === 0 ? "#fff" : "#f9fafb" }}>
                      <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{range}</td>
                      <td className="px-3 py-1.5 font-bold" style={{ color: "#166534", borderBottom: "1px solid #f3f4f6" }}>{grade}</td>
                      <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{gp}</td>
                      <td className="px-3 py-1.5" style={{ color: "#374151", borderBottom: "1px solid #f3f4f6" }}>{qp}</td>
                      <td className="px-3 py-1.5" style={{ color: "#6b7280", borderBottom: "1px solid #f3f4f6" }}>{desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[10px] mt-3" style={{ color: "#9ca3af" }}>
                CGPA = Σ (Grade Point × Credit Unit) ÷ Σ Credit Units. Each week = 1 credit unit.
              </p>
            </div>

            {/* ── 6. Certification ────────────────────────────────────────── */}
            <div
              className="mx-10 mb-10 rounded-xl p-6"
              style={{ background: "#f9fafb", border: "1px solid #e5e7eb" }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>
                Certification
              </p>
              <p className="text-sm leading-relaxed mb-6" style={{ color: "#374151" }}>
                This is to certify that the academic record presented above is the official
                performance record of{" "}
                <strong>{student.first_name} {student.last_name}</strong> in the 52-Week
                Leadership Development Program at LEAD Academy. The student has successfully
                completed all 52 weeks of the programme.
              </p>

              <div className="flex justify-between items-end flex-wrap gap-8">
                <div>
                  <div style={{ borderBottom: "1px solid #d1d5db", width: "180px", marginBottom: "4px" }} />
                  <p className="text-sm font-bold" style={{ color: "#111827" }}>
                    {student.first_name} {student.last_name}
                  </p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>Student Signature</p>
                </div>
                <div className="text-right">
                  <div style={{ borderBottom: "1px solid #d1d5db", width: "180px", marginBottom: "4px", marginLeft: "auto" }} />
                  <p className="text-sm font-bold" style={{ color: "#111827" }}>Lead Administrator</p>
                  <p className="text-xs" style={{ color: "#6b7280" }}>LEAD Academy · {issueDate}</p>
                </div>
              </div>

              <div
                className="mt-6 pt-4 flex items-center justify-between flex-wrap gap-2 text-[10px]"
                style={{ borderTop: "1px dashed #d1d5db", color: "#9ca3af" }}
              >
                <span>Document Ref: <strong style={{ color: "#6b7280" }}>{txRef}</strong></span>
                <span>
                  This document is official when printed or saved as PDF from the LEAD Academy student portal.
                </span>
              </div>
            </div>
          </motion.div>

          {/* Footer note */}
          <p className="print:hidden text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
            This is an admin preview with sample data. Real student transcripts are generated from the Scores tab in the student portal.
          </p>
        </div>
      </div>

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
