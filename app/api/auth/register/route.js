import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Create Supabase client with service role key for admin operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request) {
  try {
    const { paymentId } = await request.json();

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    // Step 1: Get payment record
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("id", paymentId)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: "Payment record not found" },
        { status: 404 }
      );
    }

    // Step 2: Verify payment is successful
    if (payment.status !== "successful") {
      return NextResponse.json(
        { error: "Payment not verified. Please complete payment first." },
        { status: 400 }
      );
    }

    // Step 3: Check if already registered
    if (payment.user_id) {
      return NextResponse.json(
        { error: "This payment has already been used for registration." },
        { status: 400 }
      );
    }

    // Step 4: Get registration data from payment
    const registrationData = payment.registration_data;

    if (!registrationData) {
      return NextResponse.json(
        {
          error:
            "Registration data not found. Please start registration again.",
        },
        { status: 400 }
      );
    }

    // Step 5: Create auth user
    const { data: authData, error: authError } =
      await supabaseAdmin.auth.admin.createUser({
        email: registrationData.email,
        password: registrationData.password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
        },
      });

    if (authError) {
      console.error("Auth user creation error:", authError);
      return NextResponse.json(
        { error: authError.message || "Failed to create user account" },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    // Step 6: Upload profile picture (if provided)
    let profilePictureUrl = null;
    if (registrationData.profilePicture) {
      try {
        // Profile picture is stored as base64 in registration_data
        const base64Data = registrationData.profilePicture.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");

        const fileExt = "jpg"; // or detect from data URL
        const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

        const { data: uploadData, error: uploadError } =
          await supabaseAdmin.storage
            .from("profile-pictures")
            .upload(fileName, buffer, {
              contentType: "image/jpeg",
              cacheControl: "3600",
              upsert: false,
            });

        if (!uploadError && uploadData) {
          const {
            data: { publicUrl },
          } = supabaseAdmin.storage
            .from("profile-pictures")
            .getPublicUrl(fileName);

          profilePictureUrl = publicUrl;
        }
      } catch (uploadError) {
        console.warn("Profile picture upload failed:", uploadError);
        // Continue without profile picture
      }
    }

    // Step 7: Create student profile
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from("students")
      .insert([
        {
          user_id: userId,
          first_name: registrationData.firstName,
          last_name: registrationData.lastName,
          middle_name: registrationData.middleName || null,
          email: registrationData.email,
          phone_number: registrationData.phoneNumber,
          telegram_phone: registrationData.telegramPhone,
          country: registrationData.country,
          detected_country: registrationData.detectedCountry || null,
          city: registrationData.city,
          profile_picture_url: profilePictureUrl,
          is_active: true,
        },
      ])
      .select()
      .single();

    if (studentError) {
      console.error("Student creation error:", studentError);
      // Rollback: Delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: "Failed to create student profile" },
        { status: 500 }
      );
    }

    // Step 8: Link payment to user
    const { error: linkError } = await supabaseAdmin
      .from("payments")
      .update({
        user_id: userId,
        student_id: studentData.id,
      })
      .eq("id", paymentId);

    if (linkError) {
      console.error("Payment link error:", linkError);
    }

    // Step 9: Create session for the user
    const { data: sessionData, error: sessionError } =
      await supabaseAdmin.auth.admin.generateLink({
        type: "magiclink",
        email: registrationData.email,
      });

    return NextResponse.json({
      success: true,
      data: {
        user: authData.user,
        student: studentData,
        sessionUrl: sessionData?.properties?.action_link,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}
