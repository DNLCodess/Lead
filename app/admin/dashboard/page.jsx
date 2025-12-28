// app/admin/dashboard/page.jsx

"use client";

import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { AdminService } from "@/lib/services/admin-service";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  BookOpen,
  DollarSign,
  ArrowUpRight,
  Calendar,
} from "lucide-react";

export default function AdminDashboardPage() {
  const supabase = createClient();

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => AdminService.getDashboardStats(supabase),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-2xl animate-pulse"
              style={{ background: "var(--color-black-surface)" }}
            />
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Students",
      value: stats?.students?.total || 0,
      change: `+${stats?.students?.newThisMonth || 0} this month`,
      trend: "up",
      icon: Users,
      color: "#1ed760",
    },
    {
      label: "Revenue (NGN)",
      value: `₦${(stats?.payments?.revenue?.ngn?.total || 0).toLocaleString()}`,
      change: `₦${(
        stats?.payments?.revenue?.ngn?.thisMonth || 0
      ).toLocaleString()} this month`,
      trend: "up",
      icon: DollarSign,
      color: "#f59e0b",
    },
    {
      label: "Revenue (USD)",
      value: `$${(stats?.payments?.revenue?.usd?.total || 0).toLocaleString()}`,
      change: `$${(
        stats?.payments?.revenue?.usd?.thisMonth || 0
      ).toLocaleString()} this month`,
      trend: "up",
      icon: CreditCard,
      color: "#8b5cf6",
    },
    {
      label: "Week Unlocks",
      value: stats?.weeks?.totalUnlocks || 0,
      change: `Avg week ${stats?.students?.averageWeek || 1}`,
      trend: "neutral",
      icon: BookOpen,
      color: "#3b82f6",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1
          className="text-3xl font-bold mb-2"
          style={{
            fontFamily: "var(--font-satoshi)",
            color: "var(--text-primary)",
          }}
        >
          Dashboard Overview
        </h1>
        <p style={{ color: "var(--text-secondary)" }}>
          Comprehensive analytics and insights for LEAD program
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-6 rounded-2xl"
              style={{
                background: "var(--color-black-surface)",
                border: "1px solid var(--color-black-border)",
              }}
            >
              <div className="flex items-start justify-between mb-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{
                    background: `${stat.color}20`,
                  }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
                {stat.trend === "up" && (
                  <div className="flex items-center gap-1 text-green-500 text-sm font-semibold">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                )}
              </div>

              <p
                className="text-sm mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                {stat.label}
              </p>
              <p
                className="text-3xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {stat.value}
              </p>
              <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                {stat.change}
              </p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Student Distribution
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#1ed760" }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Nigerian Students
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.students?.nigerian || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#3b82f6" }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  International Students
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.students?.international || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#f59e0b" }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Active Students
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.students?.active || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#ef4444" }}
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Inactive Students
                </span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.students?.inactive || 0}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Payment Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Payment Status
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#1ed760" }}
                />
                <span style={{ color: "var(--text-primary)" }}>Successful</span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.payments?.successful || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#f59e0b" }}
                />
                <span style={{ color: "var(--text-primary)" }}>Pending</span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.payments?.pending || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: "#ef4444" }}
                />
                <span style={{ color: "var(--text-primary)" }}>Failed</span>
              </div>
              <span
                className="font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                {stats?.payments?.failed || 0}
              </span>
            </div>

            <div
              className="pt-4 mt-4 border-t"
              style={{ borderColor: "var(--color-black-border)" }}
            >
              <div className="flex items-center justify-between">
                <span style={{ color: "var(--text-secondary)" }}>
                  Average Transaction
                </span>
                <span
                  className="font-bold"
                  style={{ color: "var(--color-green-primary)" }}
                >
                  ₦{(stats?.payments?.averageTransaction || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Students
            </h3>
            <a
              href="/admin/dashboard/students"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--color-green-primary)" }}
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity?.recentStudents
              ?.slice(0, 5)
              .map((student) => (
                <div
                  key={student.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--color-black-elevated)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: "linear-gradient(135deg, #1ed760, #16b455)",
                    }}
                  >
                    <span className="text-white font-bold text-sm">
                      {student.first_name?.charAt(0)}
                      {student.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {student.first_name} {student.last_name}
                    </p>
                    <p
                      className="text-sm truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {student.email}
                    </p>
                  </div>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(student.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Recent Payments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Payments
            </h3>
            <a
              href="/admin/dashboard/payments"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--color-green-primary)" }}
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          <div className="space-y-3">
            {stats?.recentActivity?.recentPayments
              ?.slice(0, 5)
              .map((payment) => (
                <div
                  key={payment.id}
                  className="flex items-center gap-3 p-3 rounded-xl"
                  style={{ background: "var(--color-black-elevated)" }}
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        payment.status === "completed"
                          ? "#1ed76020"
                          : payment.status === "pending"
                          ? "#f59e0b20"
                          : "#ef444420",
                    }}
                  >
                    <CreditCard
                      className="w-5 h-5"
                      style={{
                        color:
                          payment.status === "completed"
                            ? "#1ed760"
                            : payment.status === "pending"
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="font-semibold truncate"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {payment.currency === "NGN" ? "₦" : "$"}
                      {parseFloat(payment.amount).toLocaleString()}
                    </p>
                    <p
                      className="text-sm truncate"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {payment.email}
                    </p>
                  </div>
                  <div className="text-right">
                    <div
                      className="text-xs px-2 py-1 rounded-full"
                      style={{
                        background:
                          payment.status === "completed"
                            ? "#1ed76020"
                            : payment.status === "pending"
                            ? "#f59e0b20"
                            : "#ef444420",
                        color:
                          payment.status === "completed"
                            ? "#1ed760"
                            : payment.status === "pending"
                            ? "#f59e0b"
                            : "#ef4444",
                      }}
                    >
                      {payment.status}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
