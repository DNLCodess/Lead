// app/admin/dashboard/activity/page.jsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  Activity,
  Filter,
  Download,
  Search,
  Calendar,
  User,
  FileText,
  AlertCircle,
} from "lucide-react";

export default function ActivityLogsPage() {
  const supabase = createClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  // Fetch activity logs
  const { data: logs, isLoading } = useQuery({
    queryKey: ["admin-activity-logs", filterAction, dateRange],
    queryFn: async () => {
      let query = supabase
        .from("admin_activity_logs")
        .select(
          `
          *,
          lecturers(name, email)
        `
        )
        .order("created_at", { ascending: false })
        .limit(100);

      if (filterAction !== "all") {
        query = query.eq("action_type", filterAction);
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
      return data;
    },
  });

  // Filter logs by search
  const filteredLogs = logs?.filter((log) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      log.lecturers?.name?.toLowerCase().includes(searchLower) ||
      log.lecturers?.email?.toLowerCase().includes(searchLower) ||
      log.action_type?.toLowerCase().includes(searchLower) ||
      log.resource_type?.toLowerCase().includes(searchLower)
    );
  });

  // Export logs
  const handleExport = () => {
    if (!filteredLogs?.length) return;

    const csvData = filteredLogs.map((log) => ({
      Timestamp: new Date(log.created_at).toLocaleString(),
      Lecturer: log.lecturers?.name || "Unknown",
      Action: log.action_type,
      Resource: log.resource_type || "N/A",
      "Resource ID": log.resource_id || "N/A",
      "IP Address": log.ip_address || "N/A",
      Details: JSON.stringify(log.details || {}),
    }));

    const csv = [
      Object.keys(csvData[0]).join(","),
      ...csvData.map((row) => Object.values(row).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-logs-${new Date().toISOString()}.csv`;
    a.click();
  };

  const getActionIcon = (actionType) => {
    if (actionType?.includes("create")) return <Plus className="w-5 h-5" />;
    if (actionType?.includes("update")) return <Edit className="w-5 h-5" />;
    if (actionType?.includes("delete")) return <Trash2 className="w-5 h-5" />;
    if (actionType?.includes("login")) return <User className="w-5 h-5" />;
    return <Activity className="w-5 h-5" />;
  };

  const getActionColor = (actionType) => {
    if (actionType?.includes("create"))
      return { bg: "#1ed76020", color: "#1ed760" };
    if (actionType?.includes("update"))
      return { bg: "#3b82f620", color: "#3b82f6" };
    if (actionType?.includes("delete"))
      return { bg: "#ef444420", color: "#ef4444" };
    if (actionType?.includes("login"))
      return { bg: "#8b5cf620", color: "#8b5cf6" };
    return { bg: "#6b728020", color: "#6b7280" };
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
            Activity Logs
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {filteredLogs?.length || 0} activities logged
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
        <div className="relative">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search activities..."
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

        {/* Action Filter */}
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="px-4 py-3 rounded-xl outline-none"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            color: "var(--text-primary)",
          }}
        >
          <option value="all">All Actions</option>
          <option value="login">Login</option>
          <option value="logout">Logout</option>
          <option value="create">Create</option>
          <option value="update">Update</option>
          <option value="delete">Delete</option>
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

      {/* Activity Timeline */}
      <div
        className="card rounded-xl overflow-hidden"
      >
        <div className="p-6 space-y-4">
          {filteredLogs?.map((log, index) => {
            const actionStyle = getActionColor(log.action_type);

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className="card p-4 rounded-xl flex items-start gap-4"
              >
                {/* Icon */}
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: actionStyle.bg }}
                >
                  <div style={{ color: actionStyle.color }}>
                    {getActionIcon(log.action_type)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <p
                        className="font-semibold mb-1"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {log.lecturers?.name || "Unknown User"}
                      </p>
                      <p
                        className="text-sm capitalize"
                        style={{ color: actionStyle.color }}
                      >
                        {log.action_type?.replace(/_/g, " ")}
                        {log.resource_type && ` - ${log.resource_type}`}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p
                        className="text-sm font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {new Date(log.created_at).toLocaleDateString()}
                      </p>
                      <p
                        className="text-xs"
                        style={{ color: "var(--text-muted)" }}
                      >
                        {new Date(log.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>

                  {/* Details */}
                  {log.details && Object.keys(log.details).length > 0 && (
                    <div
                      className="mt-2 p-3 rounded-lg text-sm"
                      style={{
                        background: "var(--color-black-base)",
                      }}
                    >
                      <pre
                        className="text-xs overflow-auto"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}

                  {/* IP Address */}
                  {log.ip_address && (
                    <p
                      className="text-xs mt-2"
                      style={{ color: "var(--text-muted)" }}
                    >
                      IP: {log.ip_address}
                    </p>
                  )}
                </div>
              </motion.div>
            );
          })}

          {filteredLogs?.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle
                className="w-12 h-12 mx-auto mb-4"
                style={{ color: "var(--text-muted)" }}
              />
              <p style={{ color: "var(--text-muted)" }}>
                No activity logs found
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
