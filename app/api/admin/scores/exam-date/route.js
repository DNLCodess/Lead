// app/api/admin/scores/exam-date/route.js
// Admin-only: set or clear the exam date and description for a week

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

// PATCH /api/admin/scores/exam-date
// Body: { week_number, exam_date (ISO string or null), exam_description, exam_link }
export async function PATCH(request) {
  try {
    const body = await request.json();
    const { week_number, exam_date, exam_description, exam_link } = body;

    if (!week_number || week_number < 1 || week_number > 52) {
      return NextResponse.json(
        { error: "Valid week_number (1–52) is required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("week_content")
      .update({
        exam_date: exam_date || null,
        exam_description: exam_description || null,
        exam_link: exam_link || null,
      })
      .eq("week_number", week_number);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[PATCH /api/admin/scores/exam-date]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
