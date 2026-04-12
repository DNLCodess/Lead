// app/api/payment/check-pending/route.js

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Check for:
 * 1. Week payments that are successful but haven't unlocked weeks (stuck payments)
 * 2. Recent pending payments (in-flight bank transfers)
 *
 * Excludes registration payments by checking for weeks_to_unlock in registration_data.
 */
export async function GET(request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Single query: successful week payments + their unlock records (fixes N+1)
    // Filter by registration_data having weeks_to_unlock (excludes registration payments)
    const { data: successfulPayments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select(`
        id,
        tx_ref,
        amount,
        currency,
        created_at,
        transaction_id,
        registration_data,
        user_week_payments(week_number)
      `)
      .eq("user_id", userId)
      .eq("status", "successful")
      .not("registration_data->weeks_to_unlock", "is", null);

    if (paymentsError) throw paymentsError;

    // Payments that were successful but have no unlocked weeks = stuck
    const stuckPayments = (successfulPayments || [])
      .filter((p) => !p.user_week_payments?.length)
      .map((p) => ({
        id: p.id,
        tx_ref: p.tx_ref,
        amount: p.amount,
        currency: p.currency,
        created_at: p.created_at,
        transaction_id: p.transaction_id,
        expected_weeks: p.registration_data?.weeks_to_unlock?.length || 0,
        type: "stuck",
      }));

    // Auto-verify stuck payments that have a transaction_id (older than 10 min)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const { data: oldPendingWithTxId } = await supabaseAdmin
      .from("payments")
      .select("id, tx_ref, amount, currency, created_at, transaction_id, registration_data")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("registration_data->weeks_to_unlock", "is", null)
      .not("transaction_id", "is", null)
      .lt("created_at", tenMinutesAgo);

    for (const payment of oldPendingWithTxId || []) {
      try {
        const flwResponse = await fetch(
          `https://api.flutterwave.com/v3/transactions/${payment.transaction_id}/verify`,
          {
            headers: {
              Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
            },
          },
        );

        if (flwResponse.ok) {
          const flwData = await flwResponse.json();
          if (flwData.status === "success" && flwData.data.status === "successful") {
            stuckPayments.push({
              id: payment.id,
              tx_ref: payment.tx_ref,
              amount: payment.amount,
              currency: payment.currency,
              created_at: payment.created_at,
              transaction_id: payment.transaction_id,
              expected_weeks: payment.registration_data?.weeks_to_unlock?.length || 0,
              type: "stuck",
            });
          }
        }
      } catch (_) {
        // Ignore individual verification errors
      }
    }

    // In-flight bank transfers: pending payments within the last 24h with no transaction_id
    // These are payments where the user may have left the browser to complete a bank transfer
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: inFlightTransfers } = await supabaseAdmin
      .from("payments")
      .select("id, tx_ref, amount, currency, created_at, registration_data")
      .eq("user_id", userId)
      .eq("status", "pending")
      .not("registration_data->weeks_to_unlock", "is", null)
      .is("transaction_id", null)
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(1);

    const inFlight = (inFlightTransfers || []).map((p) => ({
      id: p.id,
      tx_ref: p.tx_ref,
      amount: p.amount,
      currency: p.currency,
      created_at: p.created_at,
      expected_weeks: p.registration_data?.weeks_to_unlock?.length || 0,
      type: "in_flight",
    }));

    return NextResponse.json({
      success: true,
      data: stuckPayments,
      in_flight: inFlight,
      count: stuckPayments.length,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check pending payments",
      },
      { status: 500 },
    );
  }
}
