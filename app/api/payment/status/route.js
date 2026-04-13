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

    // Query payment from database
    const { data: payment, error } = await supabase
      .from("payments")
      .select("*")
      .eq("tx_ref", txRef)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        // Not found yet - payment might still be processing
        return NextResponse.json({
          success: true,
          data: { status: "pending", tx_ref: txRef },
        });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      data: {
        status: payment.status,
        transaction_id: payment.transaction_id,
        tx_ref: payment.tx_ref,
        amount: payment.amount,
        currency: payment.currency,
      },
    });
  } catch (error) {
    console.error("[Status API] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to check payment status",
      },
      { status: 500 }
    );
  }
}

// Enable CORS
export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
