// app/admin/dashboard/payments/page.jsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Filter,
  Download,
  CreditCard,
  Calendar,
  DollarSign,
  TrendingUp,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  RefreshCw,
} from "lucide-react";

export default function PaymentsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);

  // Fetch payments with related data
  const {
    data: paymentsData,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["admin-payments", filterStatus, filterCurrency, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("payments")
        .select(
          `
          *,
          students!payments_student_id_fkey(
            id,
            first_name,
            last_name,
            email,
            country,
            account_type
          )
        `
        )
        .order("created_at", { ascending: false });

      if (filterStatus !== "all") {
        query = query.eq("status", filterStatus);
      }

      if (filterCurrency !== "all") {
        query = query.eq("currency", filterCurrency);
      }

      if (dateRange !== "all") {
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case "today":
            startDate = new Date(now.setHours(0, 0, 0, 0));
            break;
          case "week":
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case "month":
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
        }

        if (startDate) {
          query = query.gte("created_at", startDate.toISOString());
        }
      }

      const { data, error } = await query;
      if (error) throw error;

      // Calculate statistics
      const stats = {
        total: data.length,
        successful: data.filter((p) => p.status === "successful").length,
        pending: data.filter((p) => p.status === "pending").length,
        failed: data.filter((p) => p.status === "failed").length,
        totalRevenue: {
          ngn: data
            .filter((p) => p.status === "completed" && p.currency === "NGN")
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
          usd: data
            .filter((p) => p.status === "completed" && p.currency === "USD")
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
        },
      };

      return { payments: data, stats };
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  const { payments = [], stats } = paymentsData || {};

  // Filter payments by search query
  const filteredPayments = payments?.filter((payment) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      payment.email?.toLowerCase().includes(searchLower) ||
      payment.tx_ref?.toLowerCase().includes(searchLower) ||
      payment.first_name?.toLowerCase().includes(searchLower) ||
      payment.last_name?.toLowerCase().includes(searchLower)
    );
  });

  // Export payments data
  const handleExport = () => {
    if (!filteredPayments?.length) return;

    const csvData = filteredPayments.map((payment) => ({
      "Transaction ID": payment.tx_ref,
      Name: `${payment.first_name} ${payment.last_name}`,
      Email: payment.email,
      Amount: payment.amount,
      Currency: payment.currency,
      Status: payment.status,
      "Payment Method": payment.payment_method || "N/A",
      Country: payment.country,
      Date: new Date(payment.created_at).toLocaleString(),
      "Paid At": payment.paid_at
        ? new Date(payment.paid_at).toLocaleString()
        : "N/A",
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payments-export-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5" />;
      case "pending":
        return <Clock className="w-5 h-5" />;
      case "failed":
        return <XCircle className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return { bg: "#1ed76020", color: "#1ed760" };
      case "pending":
        return { bg: "#f59e0b20", color: "#f59e0b" };
      case "failed":
        return { bg: "#ef444420", color: "#ef4444" };
      default:
        return { bg: "#6b728020", color: "#6b7280" };
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-xl animate-pulse bg-black-surface" />
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-xl animate-pulse bg-black-surface"
            />
          ))}
        </div>
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
            Payment Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {filteredPayments?.length || 0} payments found
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
            style={{
              background: "var(--color-black-elevated)",
              color: "var(--text-primary)",
            }}
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
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
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#1ed76020" }}
            >
              <CheckCircle className="w-6 h-6" style={{ color: "#1ed760" }} />
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Successful Payments
          </p>
          <p
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {stats?.successful || 0}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            ₦{(stats?.totalRevenue?.ngn || 0).toLocaleString()} | $
            {(stats?.totalRevenue?.usd || 0).toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#f59e0b20" }}
            >
              <Clock className="w-6 h-6" style={{ color: "#f59e0b" }} />
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Pending Payments
          </p>
          <p
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {stats?.pending || 0}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Awaiting confirmation
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#ef444420" }}
            >
              <XCircle className="w-6 h-6" style={{ color: "#ef4444" }} />
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Failed Payments
          </p>
          <p
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {stats?.failed || 0}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            Requires attention
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-6 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ background: "#8b5cf620" }}
            >
              <TrendingUp className="w-6 h-6" style={{ color: "#8b5cf6" }} />
            </div>
          </div>
          <p className="text-sm mb-1" style={{ color: "var(--text-muted)" }}>
            Total Payments
          </p>
          <p
            className="text-3xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            {stats?.total || 0}
          </p>
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            All time
          </p>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search payments..."
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
          <option value="completed">Completed</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
          <option value="cancelled">Cancelled</option>
        </select>

        {/* Currency Filter */}
        <select
          value={filterCurrency}
          onChange={(e) => setFilterCurrency(e.target.value)}
          className="px-4 py-3 rounded-xl outline-none"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">All Currencies</option>
          <option value="NGN">NGN (₦)</option>
          <option value="USD">USD ($)</option>
        </select>

        {/* Date Range Filter */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-3 rounded-xl outline-none"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">Last 7 Days</option>
          <option value="month">Last 30 Days</option>
        </select>
      </div>

      {/* Payments Table */}
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
                  Transaction
                </th>
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
                  Amount
                </th>
                <th
                  className="text-left px-6 py-4 font-semibold"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Method
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
                  Date
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
              {filteredPayments?.map((payment, index) => {
                const statusStyle = getStatusColor(payment.status);
                return (
                  <motion.tr
                    key={payment.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.02 }}
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
                    {/* Transaction */}
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className="font-mono text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {payment.tx_ref}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {payment.flw_ref}
                        </p>
                      </div>
                    </td>

                    {/* Student */}
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {payment.first_name} {payment.last_name}
                        </p>
                        <p
                          className="text-sm"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {payment.email}
                        </p>
                      </div>
                    </td>

                    {/* Amount */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <DollarSign
                          className="w-4 h-4"
                          style={{ color: "var(--color-green-primary)" }}
                        />
                        <span
                          className="font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {payment.currency === "NGN" ? "₦" : "$"}
                          {parseFloat(payment.amount).toLocaleString()}
                        </span>
                      </div>
                    </td>

                    {/* Method */}
                    <td className="px-6 py-4">
                      <span
                        className="capitalize"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {payment.payment_method || "N/A"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold capitalize"
                        style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                        }}
                      >
                        {getStatusIcon(payment.status)}
                        {payment.status}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <div>
                        <p
                          className="text-sm font-semibold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {new Date(payment.created_at).toLocaleDateString()}
                        </p>
                        <p
                          className="text-xs"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {new Date(payment.created_at).toLocaleTimeString()}
                        </p>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => setSelectedPayment(payment)}
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
                );
              })}
            </tbody>
          </table>

          {filteredPayments?.length === 0 && (
            <div className="text-center py-12">
              <p style={{ color: "var(--text-muted)" }}>No payments found</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Detail Modal */}
      <PaymentDetailModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}

// Payment Detail Modal Component
function PaymentDetailModal({ payment, onClose }) {
  if (!payment) return null;

  const statusStyle = {
    completed: { bg: "#1ed76020", color: "#1ed760" },
    pending: { bg: "#f59e0b20", color: "#f59e0b" },
    failed: { bg: "#ef444420", color: "#ef4444" },
  }[payment.status] || { bg: "#6b728020", color: "#6b7280" };

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
                Payment Details
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
            {/* Status Badge */}
            <div className="flex items-center justify-between">
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full font-bold capitalize"
                style={{
                  background: statusStyle.bg,
                  color: statusStyle.color,
                }}
              >
                {payment.status === "completed" && (
                  <CheckCircle className="w-5 h-5" />
                )}
                {payment.status === "pending" && <Clock className="w-5 h-5" />}
                {payment.status === "failed" && <XCircle className="w-5 h-5" />}
                {payment.status}
              </div>
              <div className="text-right">
                <p
                  className="text-3xl font-bold"
                  style={{ color: "var(--color-green-primary)" }}
                >
                  {payment.currency === "NGN" ? "₦" : "$"}
                  {parseFloat(payment.amount).toLocaleString()}
                </p>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {payment.currency}
                </p>
              </div>
            </div>

            {/* Transaction Info */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: "var(--color-black-elevated)" }}
            >
              <h3
                className="font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Transaction Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Transaction Reference
                  </p>
                  <p
                    className="font-mono text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.tx_ref}
                  </p>
                </div>

                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Flutterwave Reference
                  </p>
                  <p
                    className="font-mono text-sm font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.flw_ref}
                  </p>
                </div>

                {payment.transaction_id && (
                  <div>
                    <p
                      className="text-sm mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Transaction ID
                    </p>
                    <p
                      className="font-mono text-sm font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {payment.transaction_id}
                    </p>
                  </div>
                )}

                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Payment Method
                  </p>
                  <p
                    className="font-semibold capitalize"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.payment_method || "N/A"}
                  </p>
                </div>
              </div>
            </div>

            {/* Customer Info */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: "var(--color-black-elevated)" }}
            >
              <h3
                className="font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Customer Information
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Name
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.first_name} {payment.last_name}
                  </p>
                </div>

                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Email
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.email}
                  </p>
                </div>

                <div>
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
                    {payment.phone_number}
                  </p>
                </div>

                <div>
                  <p
                    className="text-sm mb-1"
                    style={{ color: "var(--text-muted)" }}
                  >
                    Country
                  </p>
                  <p
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {payment.country}
                  </p>
                </div>
              </div>
            </div>

            {/* Dates */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: "var(--color-black-elevated)" }}
            >
              <h3
                className="font-bold mb-3"
                style={{ color: "var(--text-primary)" }}
              >
                Timeline
              </h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span style={{ color: "var(--text-secondary)" }}>
                    Created At
                  </span>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    {new Date(payment.created_at).toLocaleString()}
                  </span>
                </div>

                {payment.paid_at && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Paid At
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {new Date(payment.paid_at).toLocaleString()}
                    </span>
                  </div>
                )}

                {payment.verified_at && (
                  <div className="flex items-center justify-between">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Verified At
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {new Date(payment.verified_at).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Registration Data */}
            {payment.registration_data && (
              <div
                className="p-4 rounded-xl"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <h3
                  className="font-bold mb-3"
                  style={{ color: "var(--text-primary)" }}
                >
                  Additional Information
                </h3>
                <pre
                  className="text-sm overflow-auto p-3 rounded-lg"
                  style={{
                    background: "var(--color-black-base)",
                    color: "var(--text-primary)",
                  }}
                >
                  {JSON.stringify(payment.registration_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
