// app/admin/dashboard/page.jsx

"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { AdminService } from "@/lib/services/admin-service";
import Link from "next/link";
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
  const supabase = useMemo(() => createClient(), []);

  // Fetch dashboard stats
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: () => AdminService.getDashboardStats(supabase),
    staleTime: 30 * 1000,
    refetchInterval: 30000,
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

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-64 gap-4">
        <p style={{ color: "var(--text-secondary)" }}>
          Could not load dashboard stats.
        </p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 rounded-xl font-semibold"
          style={{ background: "var(--color-green-primary)", color: "#ffffff" }}
        >
          Retry
        </button>
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
      href: "/admin/dashboard/students",
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
      href: "/admin/dashboard/payments",
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
      href: "/admin/dashboard/payments",
    },
    {
      label: "Week Unlocks",
      value: stats?.weeks?.totalUnlocks || 0,
      change: `Avg week ${stats?.students?.averageWeek || 1}`,
      trend: "neutral",
      icon: BookOpen,
      color: "#3b82f6",
      href: "/admin/dashboard/students",
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
            >
            <Link
              href={stat.href}
              className="card card-interactive p-6 block group"
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
              <div className="flex items-center justify-between">
                <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                  {stat.change}
                </p>
                <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-150" style={{ color: stat.color }} />
              </div>
            </Link>
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
          className="card p-6"
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Student Distribution
          </h3>

          {(() => {
            const total = stats?.students?.total || 0;
            const rows = [
              { label: "Nigerian", value: stats?.students?.nigerian || 0, color: "#1ed760" },
              { label: "International", value: stats?.students?.international || 0, color: "#3b82f6" },
              { label: "Active", value: stats?.students?.active || 0, color: "#f59e0b" },
              { label: "Inactive", value: stats?.students?.inactive || 0, color: "#ef4444" },
            ];
            return (
              <div className="space-y-4">
                {rows.map((row) => {
                  const pct = total > 0 ? Math.round((row.value / total) * 100) : 0;
                  return (
                    <div key={row.label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                          <span className="text-sm" style={{ color: "var(--text-primary)" }}>{row.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                          <span className="font-bold text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                            {row.value}
                          </span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, ease: "easeOut", delay: 0.5 }}
                          className="h-full rounded-full"
                          style={{ background: row.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })()}
        </motion.div>

        {/* Payment Statistics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="card p-6"
        >
          <h3
            className="text-xl font-bold mb-4"
            style={{ color: "var(--text-primary)" }}
          >
            Payment Status
          </h3>

          {(() => {
            const totalPayments =
              (stats?.payments?.successful || 0) +
              (stats?.payments?.pending || 0) +
              (stats?.payments?.failed || 0);
            const paymentRows = [
              { label: "Successful", value: stats?.payments?.successful || 0, color: "#1ed760" },
              { label: "Pending", value: stats?.payments?.pending || 0, color: "#f59e0b" },
              { label: "Failed", value: stats?.payments?.failed || 0, color: "#ef4444" },
            ];
            return (
              <>
                <div className="space-y-4">
                  {paymentRows.map((row) => {
                    const pct = totalPayments > 0 ? Math.round((row.value / totalPayments) * 100) : 0;
                    return (
                      <div key={row.label}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: row.color }} />
                            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{row.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{pct}%</span>
                            <span className="font-bold text-sm tabular-nums" style={{ color: "var(--text-primary)" }}>
                              {row.value}
                            </span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--elevated)" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }}
                            className="h-full rounded-full"
                            style={{ background: row.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
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
              </>
            );
          })()}
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Students */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Students
            </h3>
            <Link
              href="/admin/dashboard/students"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--color-green-primary)" }}
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {!stats?.recentActivity?.recentStudents?.length && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                No students registered yet
              </p>
            )}
            {stats?.recentActivity?.recentStudents
              ?.slice(0, 5)
              .map((student) => (
                <div
                  key={student.id}
                  className="card-elevated flex items-center gap-3 p-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: "#1ed760",
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
          className="card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-xl font-bold"
              style={{ color: "var(--text-primary)" }}
            >
              Recent Payments
            </h3>
            <Link
              href="/admin/dashboard/payments"
              className="text-sm font-semibold flex items-center gap-1"
              style={{ color: "var(--color-green-primary)" }}
            >
              View All
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {!stats?.recentActivity?.recentPayments?.length && (
              <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
                No payments recorded yet
              </p>
            )}
            {stats?.recentActivity?.recentPayments
              ?.slice(0, 5)
              .map((payment) => (
                <div
                  key={payment.id}
                  className="card-elevated flex items-center gap-3 p-3"
                >
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background:
                        payment.status === "successful"
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
                          payment.status === "successful"
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
                      className="text-xs px-2 py-1 rounded-full capitalize"
                      style={{
                        background:
                          payment.status === "successful"
                            ? "#1ed76020"
                            : payment.status === "pending"
                            ? "#f59e0b20"
                            : "#ef444420",
                        color:
                          payment.status === "successful"
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
