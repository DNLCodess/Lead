import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const txRef = searchParams.get("tx_ref");

    if (!txRef) {
      return NextResponse.json(
        { success: false, error: "Transaction reference is required" },
        { status: 400 }
      );
    }

    console.log("Checking payment status for tx_ref:", txRef);

    // Check database for payment status
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("tx_ref", txRef)
      .single();

    if (error) {
      console.error("Payment lookup error:", error);

      // If payment not found, return pending status (might not be created yet)
      if (error.code === "PGRST116") {
        return NextResponse.json({
          success: true,
          data: {
            status: "pending",
            message: "Payment record not found yet",
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Failed to fetch payment status" },
        { status: 500 }
      );
    }

    console.log("Payment status:", payment.status);

    return NextResponse.json({
      success: true,
      data: {
        status: payment.status,
        transaction_id: payment.transaction_id,
        amount: payment.amount,
        currency: payment.currency,
        user_id: payment.user_id,
        created_at: payment.created_at,
      },
    });
  } catch (error) {
    console.error("Status check error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
