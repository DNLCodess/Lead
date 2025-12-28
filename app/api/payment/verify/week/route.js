// app/api/payment/verify-week-payment/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const transactionId = searchParams.get("transaction_id");

    if (!transactionId) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    console.log("Verifying week payment:", transactionId);

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json(
        { error: "Unauthorized - Please log in" },
        { status: 401 }
      );
    }

    const userId = session.user.id;

    const { data: user } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", userId)
      .single();

    console.log("Current user:", user);

    // Step 1: Verify with Flutterwave
    const flwResponse = await fetch(
      `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`,
      {
        headers: {
          Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
        },
      }
    );

    if (!flwResponse.ok) {
      throw new Error("Flutterwave verification failed");
    }

    const flwData = await flwResponse.json();
    console.log("Flutterwave response:", flwData);

    if (flwData.status !== "success") {
      throw new Error("Transaction verification failed");
    }

    const transactionData = flwData.data;

    // Step 2: Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("tx_ref", transactionData.tx_ref)
      .eq("user_id", userId)
      .single();

    if (paymentError || !payment) {
      throw new Error("Payment record not found");
    }

    // ✅ FIXED: Check if weeks are already unlocked BEFORE trying to insert
    const { data: existingWeeks } = await supabaseAdmin
      .from("user_week_payments")
      .select("week_number, id")
      .eq("payment_id", payment.id);

    // If already processed, return success immediately
    if (existingWeeks && existingWeeks.length > 0) {
      console.log("Payment already processed, returning existing weeks");

      // Update payment status if needed
      if (payment.status !== "completed") {
        await supabaseAdmin
          .from("payments")
          .update({
            status: "completed",
            verified_at: new Date().toISOString(),
          })
          .eq("id", payment.id);
      }

      return NextResponse.json({
        success: true,
        data: {
          verified: true,
          alreadyProcessed: true,
          payment,
          unlockedWeeks: existingWeeks.map((w) => w.week_number),
          transactionData,
        },
      });
    }

    // Step 3: Verify transaction matches
    if (
      transactionData.status !== "successful" ||
      parseFloat(transactionData.amount) !== payment.amount ||
      transactionData.currency !== payment.currency
    ) {
      throw new Error("Transaction verification mismatch");
    }

    // Step 4: Get weeks to unlock from payment metadata
    const weeksToUnlock = payment.registration_data?.weeks_to_unlock || [];

    if (weeksToUnlock.length === 0) {
      throw new Error("No weeks specified for unlocking");
    }

    // Step 5: Create week payment records (only if not already created)
    const weekRecords = weeksToUnlock.map((weekNumber) => ({
      user_id: userId,
      payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      student_id: user.id,
      week_number: weekNumber,
      unlocked_at: new Date().toISOString(),
    }));

    const { error: weekError } = await supabaseAdmin
      .from("user_week_payments")
      .insert(weekRecords);

    if (weekError) {
      console.error("Week unlock error:", weekError);
      throw new Error("Failed to unlock weeks");
    }

    // Step 6: Update payment status
    const { error: updateError } = await supabaseAdmin
      .from("payments")
      .update({
        status: "successful",
        verified_at: new Date().toISOString(),
      })
      .eq("id", payment.id);

    if (updateError) {
      console.error("Payment update error:", updateError);
      throw new Error("Failed to update payment status");
    }

    console.log("Week payment verified successfully:", {
      paymentId: payment.id,
      unlockedWeeks: weeksToUnlock,
    });

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        payment,
        unlockedWeeks: weeksToUnlock,
        transactionData,
      },
    });
  } catch (error) {
    console.error("Week payment verification error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Payment verification failed",
      },
      { status: 500 }
    );
  }
}
