// lib/services/admin-service.js

export class AdminService {
  /**
   * Get comprehensive dashboard statistics
   */
  static async getDashboardStats(supabase) {
    const [studentsStats, paymentsStats, weekStats, recentActivity] =
      await Promise.all([
        this.getStudentsStats(supabase),
        this.getPaymentsStats(supabase),
        this.getWeekStats(supabase),
        this.getRecentActivity(supabase),
      ]);

    return {
      students: studentsStats,
      payments: paymentsStats,
      weeks: weekStats,
      recentActivity,
    };
  }

  /**
   * Get students statistics
   */
  static async getStudentsStats(supabase) {
    const { data: students, error } = await supabase
      .from("students")
      .select("id, country, account_type, current_week, created_at, is_active");

    if (error) throw error;

    const total = students.length;
    const active = students.filter((s) => s.is_active).length;
    const nigerian = students.filter(
      (s) => s.account_type === "nigerian"
    ).length;
    const international = students.filter(
      (s) => s.account_type === "international"
    ).length;

    // Students by week
    const weekDistribution = students.reduce((acc, student) => {
      const week = student.current_week;
      acc[week] = (acc[week] || 0) + 1;
      return acc;
    }, {});

    // New students this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const newThisMonth = students.filter(
      (s) => new Date(s.created_at) >= thisMonth
    ).length;

    return {
      total,
      active,
      inactive: total - active,
      nigerian,
      international,
      newThisMonth,
      weekDistribution,
      averageWeek: Math.round(
        students.reduce((sum, s) => sum + s.current_week, 0) / total
      ),
    };
  }

  /**
   * Get payments statistics
   */
  static async getPaymentsStats(supabase) {
    const { data: payments, error } = await supabase
      .from("payments")
      .select("amount, currency, status, created_at, paid_at");

    if (error) throw error;

    const successful = payments.filter((p) => p.status === "completed");
    const pending = payments.filter((p) => p.status === "pending");
    const failed = payments.filter((p) => p.status === "failed");

    // Calculate revenue
    const ngnRevenue = successful
      .filter((p) => p.currency === "NGN")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const usdRevenue = successful
      .filter((p) => p.currency === "USD")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    // Revenue this month
    const thisMonth = new Date();
    thisMonth.setDate(1);
    const thisMonthPayments = successful.filter(
      (p) => new Date(p.paid_at) >= thisMonth
    );

    const ngnThisMonth = thisMonthPayments
      .filter((p) => p.currency === "NGN")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const usdThisMonth = thisMonthPayments
      .filter((p) => p.currency === "USD")
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      total: payments.length,
      successful: successful.length,
      pending: pending.length,
      failed: failed.length,
      revenue: {
        ngn: {
          total: ngnRevenue,
          thisMonth: ngnThisMonth,
        },
        usd: {
          total: usdRevenue,
          thisMonth: usdThisMonth,
        },
      },
      averageTransaction:
        successful.length > 0
          ? (ngnRevenue + usdRevenue * 1600) / successful.length
          : 0,
    };
  }

  /**
   * Get week statistics
   */
  static async getWeekStats(supabase) {
    const { data: weekPayments, error } = await supabase
      .from("user_week_payments")
      .select("week_number, amount, currency, unlocked_at");

    if (error) throw error;

    // Students per week
    const weekDistribution = weekPayments.reduce((acc, wp) => {
      const week = wp.week_number;
      if (!acc[week]) {
        acc[week] = { count: 0, revenue: 0 };
      }
      acc[week].count += 1;
      acc[week].revenue += parseFloat(wp.amount);
      return acc;
    }, {});

    // Find most popular week
    const mostPopularWeek = Object.entries(weekDistribution).sort(
      ([, a], [, b]) => b.count - a.count
    )[0];

    return {
      totalUnlocks: weekPayments.length,
      weekDistribution,
      mostPopularWeek: mostPopularWeek
        ? {
            week: parseInt(mostPopularWeek[0]),
            students: mostPopularWeek[1].count,
          }
        : null,
    };
  }

  /**
   * Get recent activity
   */
  static async getRecentActivity(supabase) {
    const [recentPayments, recentStudents] = await Promise.all([
      supabase
        .from("payments")
        .select("id, email, amount, currency, status, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("students")
        .select("id, first_name, last_name, email, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
    ]);

    return {
      recentPayments: recentPayments.data || [],
      recentStudents: recentStudents.data || [],
    };
  }

  /**
   * Get students eligible for next week
   */
  static async getEligibleStudents(supabase, targetWeek) {
    const { data, error } = await supabase
      .from("students")
      .select(
        `
        id,
        first_name,
        last_name,
        email,
        current_week,
        user_week_payments!inner(week_number)
      `
      )
      .eq("current_week", targetWeek - 1)
      .eq("user_week_payments.week_number", targetWeek);

    if (error) throw error;
    return data;
  }

  /**
   * Log admin activity
   */
  static async logActivity(supabase, lecturerId, userId, action, details = {}) {
    const { error } = await supabase.from("admin_activity_logs").insert({
      lecturer_id: lecturerId,
      user_id: userId,
      action_type: action.type,
      resource_type: action.resource,
      resource_id: action.resourceId,
      details,
    });

    if (error) console.error("Failed to log activity:", error);
  }
}
