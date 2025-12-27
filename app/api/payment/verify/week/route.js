// app/api/payment/verify-week-payment/route.js (NEW FILE)

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;

export async function GET(request) {
  try {
    // Verify user authentication
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    console.log("Verifying week payment transaction:", transactionId);

    // Step 1: Verify with Flutterwave
    const response = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();
    console.log("Flutterwave verification response:", data);

    if (!response.ok || data.status !== "success") {
      return NextResponse.json(
        {
          error: data.message || "Payment verification failed",
        },
        { status: response.status || 400 }
      );
    }

    const transactionData = data.data;

    if (transactionData.status !== "successful") {
      return NextResponse.json(
        {
          error: "Transaction was not successful",
          status: transactionData.status,
        },
        { status: 400 }
      );
    }

    // Step 2: Update payment record
    const { data: updatedPayment, error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        transaction_id: transactionData.id.toString(),
        flw_ref: transactionData.flw_ref,
        status: "successful",
        payment_method: transactionData.payment_type || "card",
        paid_at: transactionData.created_at || new Date().toISOString(),
        verified_at: new Date().toISOString(),
        flw_response: transactionData,
      })
      .eq("tx_ref", transactionData.tx_ref)
      .eq("user_id", user.id) // Security: only update own payments
      .select()
      .single();

    if (updateError) {
      console.error("Payment update error:", updateError);
      return NextResponse.json(
        { error: "Failed to update payment record" },
        { status: 500 }
      );
    }

    // Step 3: Unlock weeks
    const registrationData = updatedPayment.registration_data;
    const weeksToUnlock = registrationData?.weeks_to_unlock || [];

    if (weeksToUnlock.length === 0) {
      return NextResponse.json(
        { error: "No weeks to unlock" },
        { status: 400 }
      );
    }

    // Create week unlock records
    const unlockRecords = weeksToUnlock.map((weekNumber) => ({
      user_id: user.id,
      student_id: updatedPayment.student_id,
      week_number: weekNumber,
      payment_id: updatedPayment.id,
      payment_ref: updatedPayment.tx_ref,
      amount: updatedPayment.amount / weeksToUnlock.length,
      currency: updatedPayment.currency,
    }));

    const { data: unlockedWeeks, error: unlockError } = await supabaseAdmin
      .from("user_week_payments")
      .upsert(unlockRecords, {
        onConflict: "user_id,week_number",
        ignoreDuplicates: false,
      })
      .select();

    if (unlockError) {
      console.error("Week unlock error:", unlockError);
      return NextResponse.json(
        { error: "Failed to unlock weeks" },
        { status: 500 }
      );
    }

    console.log("Weeks unlocked successfully:", unlockedWeeks);

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        payment: updatedPayment,
        unlockedWeeks: weeksToUnlock,
        transactionData: transactionData,
      },
    });
  } catch (error) {
    console.error("Week payment verification error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify payment" },
      { status: 500 }
    );
  }
}
