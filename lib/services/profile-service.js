// lib/services/profile-service.js

import { supabase } from "@/lib/supabase/client";
import { supabaseAdmin } from "@/lib/supabase/admin";

export class ProfileService {
  /**
   * Get complete user profile with stats
   */
  static async getUserProfile(userId) {
    try {
      const { data: student, error: studentError } = await supabase
        .from("students")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (studentError) throw studentError;

      // Get unlocked weeks count
      const { count: unlockedCount } = await supabase
        .from("user_week_payments")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get total spent
      const { data: payments } = await supabase
        .from("payments")
        .select("amount, currency")
        .eq("user_id", userId)
        .eq("status", "successful");

      const totalSpent = payments?.reduce(
        (sum, p) => sum + parseFloat(p.amount),
        0
      );

      return {
        ...student,
        stats: {
          unlockedWeeks: unlockedCount || 0,
          totalWeeks: 52,
          progress: ((unlockedCount || 0) / 52) * 100,
          totalSpent: totalSpent || 0,
          currency: student.country === "NG" ? "NGN" : "USD",
        },
      };
    } catch (error) {
      console.error("Error fetching user profile:", error);
      throw error;
    }
  }

  /**
   * Get all lecturers
   */
  static async getLecturers() {
    try {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .eq("is_active", true)
        .order("order_index");

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error fetching lecturers:", error);
      throw error;
    }
  }

  /**
   * Get unlocked weeks for user
   */
  static async getUnlockedWeeks(userId) {
    try {
      const { data, error } = await supabase
        .from("user_week_payments")
        .select("week_number, unlocked_at, amount, currency")
        .eq("user_id", userId)
        .order("week_number");

      if (error) throw error;
      return data.map((w) => w.week_number);
    } catch (error) {
      console.error("Error fetching unlocked weeks:", error);
      throw error;
    }
  }

  /**
   * Get week content
   */
  static async getWeekContent(weekNumber) {
    try {
      const { data, error } = await supabase
        .from("week_content")
        .select(
          `
          *,
          lecturer:lecturers(name, image_url)
        `
        )
        .eq("week_number", weekNumber)
        .eq("is_published", true)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching week content:", error);
      throw error;
    }
  }

  /**
   * Get user notes for a week
   */
  static async getWeekNotes(userId, weekNumber) {
    try {
      const { data, error } = await supabase
        .from("user_week_notes")
        .select("*")
        .eq("user_id", userId)
        .eq("week_number", weekNumber)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    } catch (error) {
      console.error("Error fetching week notes:", error);
      return null;
    }
  }

  /**
   * Save/update user notes for a week
   */
  static async saveWeekNotes(userId, studentId, weekNumber, notes) {
    try {
      const { data, error } = await supabase
        .from("user_week_notes")
        .upsert(
          {
            user_id: userId,
            student_id: studentId,
            week_number: weekNumber,
            notes,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,week_number",
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving week notes:", error);
      throw error;
    }
  }

  /**
   * Check if week is unlocked
   */
  static async isWeekUnlocked(userId, weekNumber) {
    try {
      const { data, error } = await supabase
        .from("user_week_payments")
        .select("id")
        .eq("user_id", userId)
        .eq("week_number", weekNumber)
        .single();

      return !!data;
    } catch (error) {
      return false;
    }
  }

  /**
   * Unlock weeks after payment (called from server-side)
   */
  static async unlockWeeks(paymentData) {
    try {
      const {
        userId,
        studentId,
        paymentId,
        paymentRef,
        weekNumbers,
        amount,
        currency,
      } = paymentData;

      const records = weekNumbers.map((weekNumber) => ({
        user_id: userId,
        student_id: studentId,
        week_number: weekNumber,
        payment_id: paymentId,
        payment_ref: paymentRef,
        amount: amount / weekNumbers.length,
        currency,
      }));

      const { data, error } = await supabaseAdmin
        .from("user_week_payments")
        .upsert(records, {
          onConflict: "user_id,week_number",
          ignoreDuplicates: false,
        })
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error unlocking weeks:", error);
      throw error;
    }
  }

  /**
   * Get payment pricing
   */
  static getPricing(accountType, paymentPlan) {
    const isNigerian = accountType === "nigerian";
    const weeklyRate = isNigerian ? 1000 : 5;
    const currency = isNigerian ? "NGN" : "USD";

    const plans = {
      daily: { weeks: 1, multiplier: 1 / 7 },
      weekly: { weeks: 1, multiplier: 1 },
      monthly: { weeks: 4, multiplier: 1 },
      bimonthly: { weeks: 8, multiplier: 1 },
      full: { weeks: 52, multiplier: 1 },
    };

    const plan = plans[paymentPlan] || plans.weekly;
    const amount =
      Math.round(weeklyRate * plan.weeks * plan.multiplier * 100) / 100;

    return {
      amount,
      currency,
      weeks: plan.weeks,
      weeklyRate,
      discount: Math.round((1 - plan.multiplier) * 100),
    };
  }
}
