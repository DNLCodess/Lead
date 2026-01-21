// app/api/payment/check-pending/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Check for payments that are successful but haven't unlocked weeks
 * This helps users identify stuck payments that need retry
 * Excludes registration payments (2000 NGN)
 */
export async function GET(request) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession();

    if (authError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all successful payments for this user (excluding registration payments)
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "successful")
      .neq("amount", 2000) // Exclude registration payments
      .order("created_at", { ascending: false });

    if (paymentsError) {
      throw paymentsError;
    }

    // Check which payments don't have unlocked weeks
    const pendingPayments = [];

    for (const payment of payments) {
      const { data: unlockedWeeks, error: weeksError } = await supabaseAdmin
        .from("user_week_payments")
        .select("week_number")
        .eq("payment_id", payment.id);

      if (weeksError) {
        console.error(
          "Error checking weeks for payment:",
          payment.id,
          weeksError,
        );
        continue;
      }

      // If payment has no unlocked weeks, it's pending
      if (!unlockedWeeks || unlockedWeeks.length === 0) {
        const expectedWeeks =
          payment.registration_data?.weeks_to_unlock?.length || 0;

        pendingPayments.push({
          id: payment.id,
          tx_ref: payment.tx_ref,
          amount: payment.amount,
          currency: payment.currency,
          created_at: payment.created_at,
          flw_transaction_id: payment.flw_transaction_id,
          expected_weeks: expectedWeeks,
        });
      }
    }

    // Also check for "pending" status payments older than 10 minutes (excluding registration)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { data: oldPendingPayments } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .neq("amount", 2000) // Exclude registration payments
      .lt("created_at", tenMinutesAgo);

    if (oldPendingPayments && oldPendingPayments.length > 0) {
      for (const payment of oldPendingPayments) {
        // Try to verify with Flutterwave if we have transaction ID
        if (payment.flw_transaction_id) {
          try {
            const flwResponse = await fetch(
              `https://api.flutterwave.com/v3/transactions/${payment.flw_transaction_id}/verify`,
              {
                headers: {
                  Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
                },
              },
            );

            if (flwResponse.ok) {
              const flwData = await flwResponse.json();

              // If payment was actually successful, add to pending list
              if (
                flwData.status === "success" &&
                flwData.data.status === "successful"
              ) {
                pendingPayments.push({
                  id: payment.id,
                  tx_ref: payment.tx_ref,
                  amount: payment.amount,
                  currency: payment.currency,
                  created_at: payment.created_at,
                  flw_transaction_id: payment.flw_transaction_id,
                  expected_weeks:
                    payment.registration_data?.weeks_to_unlock?.length || 0,
                });
              }
            }
          } catch (error) {
            console.error("Error checking old pending payment:", error);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: pendingPayments,
      count: pendingPayments.length,
    });
  } catch (error) {
    console.error("Error checking pending payments:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check pending payments",
      },
      { status: 500 },
    );
  }
}
