// services/authService.js
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useUserStore } from "../store/userStore";

export class AuthService {
  /**
   * Upload profile picture to Supabase Storage
   */
  static async uploadProfilePicture(file, userId) {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/profile-${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("profile-pictures")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

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
        }
      }

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

  /**
   * Sign in existing user
   */
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Fetch student profile
      const { data: studentData } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      // Update last login
      if (studentData) {
        await supabase
          .from("students")
          .update({ last_login: new Date().toISOString() })
          .eq("user_id", data.user.id);

        // Update Zustand store
        useUserStore.getState().setUser(studentData);
      }

      return { user: data.user, student: studentData, session: data.session };
    } catch (error) {
      console.error("Sign in error:", error);

      if (error.message.includes("Invalid login credentials")) {
        throw new Error("Invalid email or password. Please try again.");
      } else if (error.message.includes("Email not confirmed")) {
        throw new Error("Please verify your email before signing in.");
      } else {
        throw new Error(error.message || "Sign in failed. Please try again.");
      }
    }
  }

  /**
   * Sign out current user
   */
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear Zustand store
      useUserStore.getState().setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
      throw new Error("Failed to sign out");
    }
  }

  /**
   * Request password reset email
   */
  static async requestPasswordReset(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Password reset request error:", error);
      throw new Error(
        error.message ||
          "Failed to send password reset email. Please try again."
      );
    }
  }

  /**
   * Update password (for password reset)
   */
  static async updatePassword(newPassword) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Password update error:", error);

      if (error.message.includes("same as the old password")) {
        throw new Error(
          "New password must be different from your current password."
        );
      } else if (error.message.includes("Password")) {
        throw new Error("Password must be at least 8 characters long.");
      } else {
        throw new Error(
          error.message || "Failed to update password. Please try again."
        );
      }
    }
  }

  /**
   * Get current user's student profile
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

      // Update Zustand store
      if (data) {
        useUserStore.getState().setUser(data);
      }

      return data;
    } catch (error) {
      console.error("Error fetching student profile:", error);
      throw new Error("Failed to fetch student profile");
    }
  }

  /**
   * Update student profile
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

      // Update Zustand store
      if (data) {
        useUserStore.getState().setUser(data);
      }

      return data;
    } catch (error) {
      console.error("Error updating student profile:", error);
      throw new Error("Failed to update student profile");
    }
  }

  /**
   * Delete profile picture
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

  /**
   * Resend verification email
   */
  static async resendVerificationEmail(email) {
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error("Resend verification error:", error);
      throw new Error(
        error.message ||
          "Failed to resend verification email. Please try again."
      );
    }
  }
}
