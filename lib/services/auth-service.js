import { supabase } from "@/lib/supabase/client";

/**
 * Registration Service
 * Handles user registration with Supabase Auth and student profile creation
 */

export class AuthService {
  /**
   * Upload profile picture to Supabase Storage
   * @param {File} file - The image file to upload
   * @param {string} userId - The user's UUID
   * @returns {Promise<{url: string, path: string}>}
   */
  static async uploadProfilePicture(file, userId) {
    try {
      // Generate unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("profile-pictures").getPublicUrl(fileName);

      return {
        url: publicUrl,
        path: data.path,
      };
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      throw new Error("Failed to upload profile picture");
    }
  }

  /**
   * Register a new user and create their student profile
   * @param {Object} registrationData - The registration form data
   * @returns {Promise<{user: Object, student: Object}>}
   */
  static async registerStudent(registrationData) {
    const {
      firstName,
      lastName,
      middleName,
      email,
      password,
      phoneNumber,
      telegramPhone,
      country,
      detectedCountry,
      city,
      profilePicture,
    } = registrationData;

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (authError) throw authError;

      if (!authData.user) {
        throw new Error("User creation failed");
      }

      const userId = authData.user.id;

      // Step 2: Upload profile picture (if provided)
      let profilePictureUrl = null;
      if (profilePicture) {
        try {
          const { url } = await this.uploadProfilePicture(
            profilePicture,
            userId
          );
          profilePictureUrl = url;
        } catch (uploadError) {
          console.warn(
            "Profile picture upload failed, continuing with registration:",
            uploadError
          );
          // Continue registration even if image upload fails
        }
      }

      // Step 3: Create student profile
      const { data: studentData, error: studentError } = await supabase
        .from("students")
        .insert([
          {
            user_id: userId,
            first_name: firstName,
            last_name: lastName,
            middle_name: middleName || null,
            email,
            phone_number: phoneNumber,
            telegram_phone: telegramPhone,
            country,
            detected_country: detectedCountry || null,
            city,
            profile_picture_url: profilePictureUrl,
            is_active: true,
          },
        ])
        .select()
        .single();

      if (studentError) {
        // Rollback: Delete the auth user if student creation fails
        await supabase.auth.admin.deleteUser(userId);
        throw studentError;
      }

      return {
        user: authData.user,
        student: studentData,
        session: authData.session,
      };
    } catch (error) {
      console.error("Registration error:", error);

      // Provide user-friendly error messages
      if (error.message.includes("already registered")) {
        throw new Error(
          "This email is already registered. Please sign in instead."
        );
      } else if (error.message.includes("invalid email")) {
        throw new Error("Please provide a valid email address.");
      } else if (error.message.includes("Password")) {
        throw new Error("Password must be at least 8 characters long.");
      } else {
        throw new Error(
          error.message || "Registration failed. Please try again."
        );
      }
    }
  }

  static async registerStudentWithPayment(paymentId) {
    try {
      // Step 1: Get payment record
      const payment = await PaymentService.getPaymentById(paymentId);

      // Step 2: Verify payment is successful
      if (payment.status !== "successful") {
        throw new Error("Payment not verified. Please complete payment first.");
      }

      // Step 3: Check if already registered
      if (payment.user_id) {
        throw new Error("This payment has already been used for registration.");
      }

      // Step 4: Get registration data from payment
      const registrationData = payment.registration_data;

      if (!registrationData) {
        throw new Error(
          "Registration data not found. Please start registration again."
        );
      }

      // Step 5: Register the student
      const { user, student, session } = await this.registerStudent(
        registrationData
      );

      // Step 6: Link payment to user
      await PaymentService.linkPaymentToUser(paymentId, user.id, student.id);

      return { user, student, session, payment };
    } catch (error) {
      console.error("Registration with payment error:", error);
      throw error;
    }
  }
  /**
   * Sign in existing user
   * @param {string} email
   * @param {string} password
   * @returns {Promise<{user: Object, session: Object}>}
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Update last login
      await supabase
        .from("students")
        .update({ last_login: new Date().toISOString() })
        .eq("user_id", data.user.id);

      return data;
    } catch (error) {
      console.error("Sign in error:", error);
      throw new Error(error.message || "Invalid email or password");
    }
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error("Sign out error:", error);
      throw new Error("Failed to sign out");
    }
  }

  /**
   * Get current user's student profile
   * @returns {Promise<Object>}
   */
  static async getCurrentStudent() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error fetching student profile:", error);
      throw new Error("Failed to fetch student profile");
    }
  }

  /**
   * Update student profile
   * @param {Object} updates - The fields to update
   * @returns {Promise<Object>}
   */
  static async updateStudent(updates) {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("No authenticated user");

      const { data, error } = await supabase
        .from("students")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;

      return data;
    } catch (error) {
      console.error("Error updating student profile:", error);
      throw new Error("Failed to update student profile");
    }
  }

  /**
   * Delete profile picture
   * @param {string} filePath - The storage path of the image
   * @returns {Promise<void>}
   */
  static async deleteProfilePicture(filePath) {
    try {
      const { error } = await supabase.storage
        .from("profile-pictures")
        .remove([filePath]);

      if (error) throw error;
    } catch (error) {
      console.error("Error deleting profile picture:", error);
      throw new Error("Failed to delete profile picture");
    }
  }
}
