// app/api/profile/delete-account/route.js (NEW FILE)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function DELETE(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete in order (respecting foreign keys)
    await supabaseAdmin.from("user_week_notes").delete().eq("user_id", user.id);

    await supabaseAdmin
      .from("user_week_payments")
      .delete()
      .eq("user_id", user.id);

    await supabaseAdmin.from("payments").delete().eq("user_id", user.id);

    await supabaseAdmin.from("students").delete().eq("user_id", user.id);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      user.id
    );

    if (deleteError) {
      throw new Error("Failed to delete user account");
    }

    return NextResponse.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
