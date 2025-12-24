import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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

    console.log("Verifying transaction:", transactionId);

    // Step 1: Verify with Flutterwave API
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

    const responseText = await response.text();
    console.log("Flutterwave response status:", response.status);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Failed to parse response:", parseError);
      return NextResponse.json(
        {
          error: "Invalid response from payment gateway",
          details: responseText,
        },
        { status: 500 }
      );
    }

    console.log("Flutterwave verification response:", data);

    if (!response.ok) {
      console.error("Flutterwave verification failed:", {
        status: response.status,
        data,
      });

      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "Unauthorized: Invalid or expired API key",
            message: "Please check your Flutterwave secret key",
          },
          { status: 401 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          {
            error: "Transaction not found",
            message: "The transaction ID does not exist",
          },
          { status: 404 }
        );
      }

      return NextResponse.json(
        {
          error: data.message || "Payment verification failed",
        },
        { status: response.status }
      );
    }

    if (data.status !== "success") {
      return NextResponse.json(
        {
          error: "Payment verification failed",
          message: data.message,
        },
        { status: 400 }
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

    // Step 2: Update payment record in database (server-side with service role)
    console.log("Updating payment record for tx_ref:", transactionData.tx_ref);

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
      .select()
      .single();

    if (updateError) {
      console.error("Payment update error:", updateError);
      return NextResponse.json(
        {
          error: "Failed to update payment record",
          details: updateError.message,
        },
        { status: 500 }
      );
    }

    console.log("Payment updated successfully:", updatedPayment);

    return NextResponse.json({
      success: true,
      data: {
        verified: true,
        payment: updatedPayment,
        transactionData: transactionData,
      },
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    return NextResponse.json(
      {
        error: error.message || "Failed to verify payment",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
