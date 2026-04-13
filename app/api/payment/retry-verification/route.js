// app/api/payment/retry-verification/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Manual retry endpoint for failed verifications
 * This allows users to retry if their payment was successful but weeks weren't unlocked
 */
export async function POST(request) {
  try {
    const { txRef } = await request.json();

    if (!txRef) {
      return NextResponse.json(
        { error: "Transaction reference is required" },
        { status: 400 },
      );
    }


    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("tx_ref", txRef)
      .eq("user_id", userId) // Security: only owner can retry
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Check if already completed
    const { data: existingWeeks } = await supabaseAdmin
      .from("user_week_payments")
      .select("week_number")
      .eq("payment_id", payment.id);

    if (existingWeeks && existingWeeks.length > 0) {
      return NextResponse.json({
        success: true,
        alreadyProcessed: true,
        unlockedWeeks: existingWeeks.map((w) => w.week_number),
      });
    }

    // Verify with Flutterwave
    if (!payment.transaction_id) {
      return NextResponse.json(
        {
          error:
            "No transaction ID found. Payment may not have been completed.",
        },
        { status: 400 },
      );
    }

    const flwResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${payment.transaction_id}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      },
    );

    if (!flwResponse.ok) {
      throw new Error("Flutterwave verification failed");
    }

    const flwData = await flwResponse.json();

    if (flwData.status !== "success" || flwData.data.status !== "successful") {
      return NextResponse.json(
        {
          error: "Payment was not successful with Flutterwave",
          status: flwData.data?.status,
        },
        { status: 400 },
      );
    }

    // Get weeks to unlock
    const weeksToUnlock = payment.registration_data?.weeks_to_unlock || [];

    if (weeksToUnlock.length === 0) {
      return NextResponse.json(
        { error: "No weeks specified for unlocking" },
        { status: 400 },
      );
    }

    // Get student info
    const { data: student } = await supabaseAdmin
      .from("students")
      .select("id")
      .eq("user_id", userId)
      .single();

    // Unlock weeks
    const weekRecords = weeksToUnlock.map((weekNumber) => ({
      user_id: userId,
      student_id: student.id,
      payment_id: payment.id,
      week_number: weekNumber,
      amount: payment.amount / weeksToUnlock.length,
      currency: payment.currency,
      unlocked_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from("user_week_payments")
      .insert(weekRecords);

    if (insertError) {
      throw new Error("Failed to unlock weeks");
    }

    // Update payment status
    await supabaseAdmin
      .from("payments")
      .update({
        status: "successful",
        verified_at: new Date().toISOString(),
        flw_response: {
          ...(payment.flw_response || {}),
          manual_retry: true,
          retry_at: new Date().toISOString(),
        },
      })
      .eq("id", payment.id);


    return NextResponse.json({
      success: true,
      data: {
        unlockedWeeks: weeksToUnlock,
        payment: {
          id: payment.id,
          amount: payment.amount,
          currency: payment.currency,
        },
      },
    });
  } catch (error) {
    console.error("❌ Retry verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Retry failed",
      },
      { status: 500 },
    );
  }
}
