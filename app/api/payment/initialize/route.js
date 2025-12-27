import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Payment amounts based on location
const PAYMENT_AMOUNTS = {
  NG: { amount: 2000, currency: "NGN" },
  DEFAULT: { amount: 5, currency: "USD" },
};

function getPaymentAmount(countryCode) {
  const normalizedCode = countryCode?.toUpperCase();
  return PAYMENT_AMOUNTS[normalizedCode] || PAYMENT_AMOUNTS.DEFAULT;
}

function generateTxRef() {
  return `LEAD-REG-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)
    .toUpperCase()}`;
}

export async function POST(request) {
  try {
    const registrationData = await request.json();

    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      country,
      detectedCountry,
      city,
    } = registrationData;

    // Validate required fields
    if (!email || !firstName || !lastName || !phoneNumber) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Determine payment amount based on country
    const paymentCountry = country || detectedCountry || "US";
    const { amount, currency } = getPaymentAmount(paymentCountry);

    // Generate unique transaction reference
    const txRef = generateTxRef();

    // Create payment record in database
    const { data: paymentRecord, error: dbError } = await supabaseAdmin
      .from("payments")
      .insert([
        {
          tx_ref: txRef,
          flw_ref: txRef,
          email,
          first_name: firstName,
          last_name: lastName,
          phone_number: phoneNumber,
          amount,
          currency,
          country: paymentCountry,
          status: "pending",
          registration_data: registrationData,
        },
      ])
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error("Failed to create payment record");
    }

    // Prepare Flutterwave payment payload
    const paymentPayload = {
      tx_ref: txRef,
      amount,
      currency,
      payment_options: "card,banktransfer,ussd,account,mobilemoneyghana,mpesa",
      redirect_url: `${
        process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
      }/verify-payment`,
      customer: {
        email,
        phonenumber: phoneNumber,
        name: `${firstName} ${lastName}`,
      },
      customizations: {
        title: "LEAD Registration Fee",
        description: "One-time registration payment",
        logo: `${
          process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
        }/logo.png`,
      },
      meta: {
        payment_id: paymentRecord.id,
        registration_type: "student",
      },
    };

    return NextResponse.json({
      success: true,
      data: {
        txRef,
        paymentId: paymentRecord.id,
        paymentPayload,
        amount,
        currency,
      },
    });
  } catch (error) {
    console.error("Payment initialization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize payment" },
      { status: 500 }
    );
  }
}
