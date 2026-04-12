// app/api/payment/initialize/week/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ProfileService } from "@/lib/services/profile-service";

function generateTxRef() {
  return `LEAD-WEEK-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
}

export async function POST(request) {
  try {
    // ✅ Create Supabase SSR client
    const supabase = await createClient();

    const {
      data: { user },
      error: sessionError,
    } = await supabase.auth.getUser();

    if (sessionError || !user) {
      return NextResponse.json(
        {
          error: "Unauthorized - Please log in again",
          details: sessionError?.message,
        },
        { status: 401 }
      );
    }

    // user is already set from getUser() above

    const { paymentPlan, startWeek } = await request.json();

    if (!paymentPlan) {
      return NextResponse.json(
        { error: "Payment plan is required" },
        { status: 400 }
      );
    }

    // Get student profile using admin client
    const { data: student, error: studentError } = await supabaseAdmin
      .from("students")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        {
          error: "Student profile not found",
          details: studentError?.message,
        },
        { status: 404 }
      );
    }

    // Get pricing based on account type
    const accountType = student.account_type || "nigerian";
    const pricing = ProfileService.getPricing(accountType, paymentPlan);

    // Calculate which weeks to unlock
    const { data: unlockedWeeks } = await supabaseAdmin
      .from("user_week_payments")
      .select("week_number")
      .eq("user_id", user.id);

    const unlockedWeekNumbers = unlockedWeeks?.map((w) => w.week_number) || [];
    const currentWeek = startWeek || student.current_week || 1;

    // Calculate weeks to unlock
    const weeksToUnlock = [];
    let week = currentWeek;

    while (weeksToUnlock.length < pricing.weeks && week <= 52) {
      if (!unlockedWeekNumbers.includes(week)) {
        weeksToUnlock.push(week);
      }
      week++;
    }

    if (weeksToUnlock.length === 0) {
      return NextResponse.json(
        { error: "No weeks available to unlock" },
        { status: 400 }
      );
    }


    // Generate unique transaction reference
    const txRef = generateTxRef();

    // Create payment record
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert([
        {
          tx_ref: txRef,
          flw_ref: txRef,
          email: student.email,
          first_name: student.first_name,
          last_name: student.last_name,
          phone_number: student.phone_number || student.telegram_phone,
          amount: pricing.amount,
          currency: pricing.currency,
          country: student.country,
          status: "pending",
          user_id: user.id,
          student_id: student.id,
          registration_data: {
            payment_plan: paymentPlan,
            weeks_to_unlock: weeksToUnlock,
            account_type: accountType,
          },
        },
      ])
      .select()
      .single();

    if (dbError) {
      throw new Error("Failed to create payment record: " + dbError.message);
    }

    // Prepare Flutterwave payment payload
    const paymentPayload = {
      tx_ref: txRef,
      amount: pricing.amount,
      currency: pricing.currency,
      // NGN: card + local transfer methods; USD: card only (USSD/mobile-money unavailable)
      payment_options: pricing.currency === "NGN"
        ? "card,banktransfer,ussd,account"
        : "card",
      redirect_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/profile/verify-week-payment`,
      customer: {
        email: student.email,
        phonenumber: student.phone_number || student.telegram_phone,
        name: `${student.first_name} ${student.last_name}`,
      },
      customizations: {
        title: "LEAD Week Payment",
        description: `Unlock ${weeksToUnlock.length} week${
          weeksToUnlock.length > 1 ? "s" : ""
        } - ${paymentPlan} plan`,
        logo: "https://rwkeaywvokhguvftrzse.supabase.co/storage/v1/object/public/random/logo-dark.png",
      },
      meta: {
        payment_id: paymentRecord.id,
        payment_type: "week_unlock",
        weeks_to_unlock: weeksToUnlock.join(","),
        user_id: user.id,
        student_id: student.id,
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        txRef,
        paymentId: paymentRecord.id,
        paymentPayload,
        amount: pricing.amount,
        currency: pricing.currency,
        weeksToUnlock,
      },
    });
  } catch (error) {
    console.error("Week payment initialization error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to initialize payment",
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
