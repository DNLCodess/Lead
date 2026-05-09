// app/api/admin/week-content/[id]/route.js
// Admin-only: update a single week's content (PATCH)

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const ALLOWED_FIELDS = [
  "title",
  "summary",
  "telegram_link",
  "resources",
  "lecturer_id",
  "is_published",
  "exam_date",
  "exam_description",
  "exam_link",
];

// PATCH /api/admin/week-content/[id]
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: "Missing week content id" }, { status: 400 });
    }

    const body = await request.json();

    // Only pick allowed fields
    const updates = {};
    for (const field of ALLOWED_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        // Convert empty strings to null for nullable fields
        const val = body[field];
        updates[field] = val === "" ? null : val;
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("week_content")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("[PATCH /api/admin/week-content/[id]]", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 },
    );
  }
}
