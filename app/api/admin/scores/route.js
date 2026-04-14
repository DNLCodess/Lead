// app/api/admin/scores/route.js
// Admin-only: fetch students+scores for a week (GET) and upsert scores (POST)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// GET /api/admin/scores?week_number=1
// Returns all students who have unlocked the given week, merged with any
// existing scores for that week.
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekNumber = parseInt(searchParams.get("week_number"), 10);

    if (!weekNumber || weekNumber < 1 || weekNumber > 52) {
      return NextResponse.json(
        { error: "Valid week_number (1–52) is required" },
        { status: 400 },
      );
    }

    // Fetch all students who have unlocked this week
    const { data: unlocked, error: unlockError } = await supabaseAdmin
      .from("user_week_payments")
      .select("student_id, user_id")
      .eq("week_number", weekNumber);

    if (unlockError) throw unlockError;

    if (!unlocked || unlocked.length === 0) {
      return NextResponse.json({ students: [] });
    }

    const studentIds = unlocked.map((r) => r.student_id);

    // Fetch student details
    const { data: students, error: studentsError } = await supabaseAdmin
      .from("students")
      .select("id, first_name, last_name, email, account_type")
      .in("id", studentIds)
      .order("first_name");

    if (studentsError) throw studentsError;

    // Fetch existing scores for this week
    const { data: existingScores, error: scoresError } = await supabaseAdmin
      .from("week_scores")
      .select("student_id, score, grade, grade_point, remarks, updated_at")
      .eq("week_number", weekNumber)
      .in("student_id", studentIds);

    if (scoresError) throw scoresError;

    // Build a lookup map for scores
    const scoresMap = {};
    (existingScores || []).forEach((s) => {
      scoresMap[s.student_id] = s;
    });

    // Build user_id lookup map from unlock records
    const userIdMap = {};
    unlocked.forEach((r) => {
      userIdMap[r.student_id] = r.user_id;
    });

    // Merge
    const merged = (students || []).map((student) => ({
      student_id: student.id,
      user_id: userIdMap[student.id],
      first_name: student.first_name,
      last_name: student.last_name,
      email: student.email,
      account_type: student.account_type,
      score: scoresMap[student.id]?.score ?? null,
      grade: scoresMap[student.id]?.grade ?? null,
      grade_point: scoresMap[student.id]?.grade_point ?? null,
      remarks: scoresMap[student.id]?.remarks ?? null,
      last_updated: scoresMap[student.id]?.updated_at ?? null,
    }));

    return NextResponse.json({ students: merged });
  } catch (error) {
    console.error("[GET /api/admin/scores]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}

// POST /api/admin/scores
// Body: { scores: [{ student_id, user_id, week_number, score, remarks }], uploaded_by_name? }
// Upserts scores — if a score already exists it will be overwritten.
export async function POST(request) {
  try {
    const body = await request.json();
    const { scores, uploaded_by_name } = body;

    if (!Array.isArray(scores) || scores.length === 0) {
      return NextResponse.json(
        { error: "scores array is required" },
        { status: 400 },
      );
    }

    // Validate each score entry
    for (const entry of scores) {
      const { student_id, user_id, week_number, score } = entry;
      if (!student_id || !user_id || !week_number) {
        return NextResponse.json(
          { error: "Each score entry requires student_id, user_id, week_number" },
          { status: 400 },
        );
      }
      if (typeof score !== "number" || score < 0 || score > 100) {
        return NextResponse.json(
          { error: `Invalid score ${score} — must be 0–100` },
          { status: 400 },
        );
      }
    }

    const rows = scores.map((entry) => ({
      student_id: entry.student_id,
      user_id: entry.user_id,
      week_number: entry.week_number,
      score: entry.score,
      remarks: entry.remarks || null,
      uploaded_by_name: uploaded_by_name || null,
    }));

    const { data, error } = await supabaseAdmin
      .from("week_scores")
      .upsert(rows, {
        onConflict: "student_id,week_number",
        ignoreDuplicates: false,
      })
      .select("id, student_id, week_number, score, grade, grade_point");

    if (error) throw error;

    return NextResponse.json({
      success: true,
      saved: data?.length ?? 0,
      scores: data,
    });
  } catch (error) {
    console.error("[POST /api/admin/scores]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
