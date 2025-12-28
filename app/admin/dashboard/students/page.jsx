// app/admin/dashboard/students/page.jsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  Download,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Eye,
  UserCheck,
  UserX,
  Globe,
  Flag,
  CreditCard,
} from "lucide-react";

export default function StudentsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterAccountType, setFilterAccountType] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Fetch students
  const { data: students, isLoading } = useQuery({
    queryKey: ["admin-students", filterStatus, filterAccountType],
    queryFn: async () => {
      let query = supabase
        .from("students")
        .select(
          `
          *,
          user_week_payments(week_number, amount, currency, unlocked_at),
          payments(id, amount, currency, status, created_at)
        `
        )
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("is_active", filterStatus === "active");
      }

      if (filterAccountType !== "all") {
        query = query.eq("account_type", filterAccountType);
      }

      const { data, error } = await query;
      console.log("Fetched students:", { count: data?.length, error });
      if (error) throw error;
      return data;
    },
  });

  // Filter students by search query
  const filteredStudents = students?.filter((student) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      student.first_name?.toLowerCase().includes(searchLower) ||
      student.last_name?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      student.country?.toLowerCase().includes(searchLower)
    );
  });

  // Export students data
  const handleExport = () => {
    if (!filteredStudents?.length) return;

    const csvData = filteredStudents.map((student) => ({
      Name: `${student.first_name} ${student.last_name}`,
      Email: student.email,
      Country: student.country,
      "Account Type": student.account_type,
      "Current Week": student.current_week,
      "Weeks Unlocked": student.user_week_payments?.length || 0,
      Status: student.is_active ? "Active" : "Inactive",
      "Joined Date": new Date(student.created_at).toLocaleDateString(),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `students-export-${new Date().toISOString()}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-xl animate-pulse bg-black-surface" />
        <div className="h-96 rounded-2xl animate-pulse bg-black-surface" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1
            className="text-3xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            Student Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {filteredStudents?.length || 0} students found
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
          style={{
            background: "var(--color-green-primary)",
            color: "#ffffff",
          }}
        >
          <Download className="w-5 h-5" />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-1">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl outline-none"
            style={{
              background: "var(--color-black-surface)",
              border: "1px solid var(--color-black-border)",
              color: "var(--text-primary)",
            }}
          />
        </div>

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-3 rounded-xl outline-none"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>

        {/* Account Type Filter */}
        <select
          value={filterAccountType}
          onChange={(e) => setFilterAccountType(e.target.value)}
          className="px-4 py-3 rounded-xl outline-none"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">All Account Types</option>
          <option value="nigerian">Nigerian</option>
          <option value="international">International</option>
        </select>
      </div>

      {/* Students Table */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "var(--color-black-surface)",
          border: "1px solid var(--color-black-border)",
        }}
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr
                style={{
                  borderBottom: "1px solid var(--color-black-border)",
                }}
              >
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Student
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Location
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Account Type
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Progress
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Status
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Joined
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents?.map((student, index) => (
                <motion.tr
                  key={student.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="transition-colors"
                  style={{
                    borderBottom: "1px solid var(--color-black-border)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      "var(--color-black-elevated)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Student */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #1ed760, #16b455)",
                        }}
                      >
                        <span className="text-white font-bold text-sm">
                          {student.first_name?.charAt(0)}
                          {student.last_name?.charAt(0)}
                        </span>
                      </div>
                      <div className="min-w-0">
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
                    </div>
                  </td>

                  {/* Location */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <MapPin
                        className="w-4 h-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span style={{ color: "var(--text-primary)" }}>
                        {student.country}
                      </span>
                    </div>
                  </td>

                  {/* Account Type */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {student.account_type === "nigerian" ? (
                        <Flag
                          className="w-4 h-4"
                          style={{ color: "#1ed760" }}
                        />
                      ) : (
                        <Globe
                          className="w-4 h-4"
                          style={{ color: "#3b82f6" }}
                        />
                      )}
                      <span
                        className="capitalize"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {student.account_type}
                      </span>
                    </div>
                  </td>

                  {/* Progress */}
                  <td className="px-6 py-4">
                    <div>
                      <div
                        className="text-sm font-semibold mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        Week {student.current_week}/52
                      </div>
                      <div className="w-24 h-2 rounded-full overflow-hidden bg-black-elevated">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(student.current_week / 52) * 100}%`,
                            background: "var(--color-green-primary)",
                          }}
                        />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-6 py-4">
                    <div
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold"
                      style={{
                        background: student.is_active
                          ? "#1ed76020"
                          : "#ef444420",
                        color: student.is_active ? "#1ed760" : "#ef4444",
                      }}
                    >
                      {student.is_active ? (
                        <UserCheck className="w-4 h-4" />
                      ) : (
                        <UserX className="w-4 h-4" />
                      )}
                      {student.is_active ? "Active" : "Inactive"}
                    </div>
                  </td>

                  {/* Joined */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Calendar
                        className="w-4 h-4"
                        style={{ color: "var(--text-muted)" }}
                      />
                      <span style={{ color: "var(--text-primary)" }}>
                        {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => setSelectedStudent(student)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg font-semibold transition-all"
                      style={{
                        background: "var(--color-black-elevated)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <Eye className="w-4 h-4" />
                      View
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>

          {filteredStudents?.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: "var(--text-muted)" }}>No students found</p>
            </div>
          )}
        </div>
      </div>

      {/* Student Detail Modal */}
      <StudentDetailModal
        student={selectedStudent}
        onClose={() => setSelectedStudent(null)}
      />
    </div>
  );
}

// Student Detail Modal Component
function StudentDetailModal({ student, onClose }) {
  if (!student) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          {/* Header */}
          <div
            className="sticky top-0 px-6 py-4 border-b backdrop-blur-lg"
            style={{
              background: "var(--color-black-surface)",
              borderColor: "var(--color-black-border)",
            }}
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Student Details
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                style={{
                  background: "var(--color-black-elevated)",
                  color: "var(--text-primary)",
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Profile Info */}
            <div className="flex items-start gap-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #1ed760, #16b455)",
                }}
              >
                <span className="text-white font-bold text-3xl">
                  {student.first_name?.charAt(0)}
                  {student.last_name?.charAt(0)}
                </span>
              </div>
              <div className="flex-1">
                <h3
                  className="text-2xl font-bold mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.first_name} {student.last_name}
                </h3>
                <p className="mb-2" style={{ color: "var(--text-secondary)" }}>
                  {student.email}
                </p>
                <div className="flex items-center gap-3">
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold"
                    style={{
                      background: student.is_active ? "#1ed76020" : "#ef444420",
                      color: student.is_active ? "#1ed760" : "#ef4444",
                    }}
                  >
                    {student.is_active ? "Active" : "Inactive"}
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-sm font-semibold capitalize"
                    style={{
                      background:
                        student.account_type === "nigerian"
                          ? "#1ed76020"
                          : "#3b82f620",
                      color:
                        student.account_type === "nigerian"
                          ? "#1ed760"
                          : "#3b82f6",
                    }}
                  >
                    {student.account_type}
                  </div>
                </div>
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Phone Number
                </p>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.telegram_phone || student.phone_number || "N/A"}
                </p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Location
                </p>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.city}, {student.country}
                </p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Current Week
                </p>
                <p
                  className="font-semibold text-2xl"
                  style={{ color: "var(--color-green-primary)" }}
                >
                  {student.current_week}/52
                </p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Weeks Unlocked
                </p>
                <p
                  className="font-semibold text-2xl"
                  style={{ color: "var(--color-green-primary)" }}
                >
                  {student.user_week_payments?.length || 0}
                </p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Joined Date
                </p>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {new Date(student.created_at).toLocaleDateString()}
                </p>
              </div>

              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-sm mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Total Payments
                </p>
                <p
                  className="font-semibold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {student.payments?.length || 0}
                </p>
              </div>
            </div>

            {/* Week Progress */}
            <div>
              <h4
                className="font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Week Unlock History
              </h4>
              <div className="grid grid-cols-10 gap-2">
                {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => {
                  const isUnlocked = student.user_week_payments?.some(
                    (p) => p.week_number === week
                  );
                  const isCurrent = week === student.current_week;

                  return (
                    <div
                      key={week}
                      className="aspect-square rounded-lg flex items-center justify-center text-xs font-bold transition-all"
                      style={{
                        background: isUnlocked
                          ? "var(--color-green-primary)"
                          : "var(--color-black-elevated)",
                        color: isUnlocked ? "#ffffff" : "var(--text-muted)",
                        border: isCurrent
                          ? "2px solid var(--color-green-primary)"
                          : "none",
                      }}
                    >
                      {week}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment History */}
            {student.payments && student.payments.length > 0 && (
              <div>
                <h4
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Recent Payments
                </h4>
                <div className="space-y-2">
                  {student.payments.slice(0, 5).map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-3 rounded-xl"
                      style={{ background: "var(--color-black-elevated)" }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center"
                          style={{
                            background:
                              payment.status === "completed"
                                ? "#1ed76020"
                                : "#f59e0b20",
                          }}
                        >
                          <CreditCard
                            className="w-5 h-5"
                            style={{
                              color:
                                payment.status === "completed"
                                  ? "#1ed760"
                                  : "#f59e0b",
                            }}
                          />
                        </div>
                        <div>
                          <p
                            className="font-semibold"
                            style={{ color: "var(--text-primary)" }}
                          >
                            {payment.currency === "NGN" ? "₦" : "$"}
                            {parseFloat(payment.amount).toLocaleString()}
                          </p>
                          <p
                            className="text-sm"
                            style={{ color: "var(--text-muted)" }}
                          >
                            {new Date(payment.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div
                        className="px-3 py-1 rounded-full text-xs font-semibold"
                        style={{
                          background:
                            payment.status === "completed"
                              ? "#1ed76020"
                              : "#f59e0b20",
                          color:
                            payment.status === "completed"
                              ? "#1ed760"
                              : "#f59e0b",
                        }}
                      >
                        {payment.status}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
