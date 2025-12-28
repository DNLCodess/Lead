// app/admin/dashboard/lecturers/page.jsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Upload,
  UserCheck,
  UserX,
  Crown,
  Shield,
  Eye,
} from "lucide-react";

export default function LecturersPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingLecturer, setEditingLecturer] = useState(null);

  // Fetch lecturers
  const { data: lecturers, isLoading } = useQuery({
    queryKey: ["admin-lecturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lecturers")
        .select(
          `
          *,
          week_content(week_number, title)
        `
        )
        .order("order_index", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Delete lecturer mutation
  const deleteMutation = useMutation({
    mutationFn: async (lecturerId) => {
      const { error } = await supabase
        .from("lecturers")
        .delete()
        .eq("id", lecturerId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-lecturers"]);
    },
  });

  // Toggle active status mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      const { error } = await supabase
        .from("lecturers")
        .update({ is_active: !is_active })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-lecturers"]);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-12 rounded-xl animate-pulse bg-black-surface" />
        <div className="grid grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-64 rounded-2xl animate-pulse bg-black-surface"
            />
          ))}
        </div>
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
            Lecturer Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            {lecturers?.length || 0} lecturers registered
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold transition-all"
          style={{
            background: "var(--color-green-primary)",
            color: "#ffffff",
          }}
        >
          <Plus className="w-5 h-5" />
          Add Lecturer
        </button>
      </div>

      {/* Lecturers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {lecturers?.map((lecturer, index) => (
          <motion.div
            key={lecturer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "var(--color-black-surface)",
              border: "1px solid var(--color-black-border)",
            }}
          >
            {/* Header with Image */}
            <div
              className="relative h-48 bg-gradient-to-br"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-green-primary), var(--color-green-hover))",
              }}
            >
              {lecturer.image_url ? (
                <img
                  src={lecturer.image_url}
                  alt={lecturer.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-20 h-20 text-white/50" />
                </div>
              )}

              {/* Role Badge */}
              {lecturer.role && (
                <div
                  className="absolute top-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                  style={{
                    background:
                      lecturer.role === "super_admin"
                        ? "#8b5cf6"
                        : lecturer.role === "admin"
                        ? "#f59e0b"
                        : "#6b7280",
                    color: "#ffffff",
                  }}
                >
                  {lecturer.role === "super_admin" ? (
                    <Crown className="w-3 h-3" />
                  ) : lecturer.role === "admin" ? (
                    <Shield className="w-3 h-3" />
                  ) : null}
                  {lecturer.role.replace("_", " ").toUpperCase()}
                </div>
              )}

              {/* Status Badge */}
              <div
                className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1"
                style={{
                  background: lecturer.is_active ? "#1ed76020" : "#ef444420",
                  backdropFilter: "blur(10px)",
                  color: lecturer.is_active ? "#1ed760" : "#ef4444",
                }}
              >
                {lecturer.is_active ? (
                  <UserCheck className="w-3 h-3" />
                ) : (
                  <UserX className="w-3 h-3" />
                )}
                {lecturer.is_active ? "Active" : "Inactive"}
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3
                className="text-xl font-bold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                {lecturer.name}
              </h3>

              {lecturer.email && (
                <p
                  className="text-sm mb-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  {lecturer.email}
                </p>
              )}

              {lecturer.bio && (
                <p
                  className="text-sm mb-4 line-clamp-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {lecturer.bio}
                </p>
              )}

              {/* Expertise Tags */}
              {lecturer.expertise && lecturer.expertise.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {lecturer.expertise.slice(0, 3).map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--color-green-primary)20",
                        color: "var(--color-green-primary)",
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                  {lecturer.expertise.length > 3 && (
                    <span
                      className="px-3 py-1 rounded-full text-xs font-semibold"
                      style={{
                        background: "var(--color-black-elevated)",
                        color: "var(--text-muted)",
                      }}
                    >
                      +{lecturer.expertise.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Weeks Teaching */}
              <div
                className="p-3 rounded-xl mb-4"
                style={{ background: "var(--color-black-elevated)" }}
              >
                <p
                  className="text-xs mb-1"
                  style={{ color: "var(--text-muted)" }}
                >
                  Teaching Weeks
                </p>
                <p
                  className="font-bold"
                  style={{ color: "var(--text-primary)" }}
                >
                  {lecturer.weeks?.length || 0} week
                  {lecturer.weeks?.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Permissions */}
              {lecturer.role && (
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Manage Content
                    </span>
                    <span
                      style={{
                        color: lecturer.can_manage_content
                          ? "var(--color-green-primary)"
                          : "var(--text-muted)",
                      }}
                    >
                      {lecturer.can_manage_content ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      Manage Users
                    </span>
                    <span
                      style={{
                        color: lecturer.can_manage_users
                          ? "var(--color-green-primary)"
                          : "var(--text-muted)",
                      }}
                    >
                      {lecturer.can_manage_users ? "✓" : "✗"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-secondary)" }}>
                      View Analytics
                    </span>
                    <span
                      style={{
                        color: lecturer.can_view_analytics
                          ? "var(--color-green-primary)"
                          : "var(--text-muted)",
                      }}
                    >
                      {lecturer.can_view_analytics ? "✓" : "✗"}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setEditingLecturer(lecturer)}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all"
                  style={{
                    background: "var(--color-black-elevated)",
                    color: "var(--text-primary)",
                  }}
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>

                <button
                  onClick={() =>
                    toggleActiveMutation.mutate({
                      id: lecturer.id,
                      is_active: lecturer.is_active,
                    })
                  }
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl font-semibold transition-all"
                  style={{
                    background: lecturer.is_active ? "#ef444420" : "#1ed76020",
                    color: lecturer.is_active ? "#ef4444" : "#1ed760",
                  }}
                >
                  {lecturer.is_active ? (
                    <>
                      <UserX className="w-4 h-4" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      Activate
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Add Lecturer Modal */}
      <LecturerFormModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={() => {
          queryClient.invalidateQueries(["admin-lecturers"]);
          setShowAddModal(false);
        }}
      />

      {/* Edit Lecturer Modal */}
      <LecturerFormModal
        isOpen={!!editingLecturer}
        lecturer={editingLecturer}
        onClose={() => setEditingLecturer(null)}
        onSuccess={() => {
          queryClient.invalidateQueries(["admin-lecturers"]);
          setEditingLecturer(null);
        }}
      />
    </div>
  );
}

// Lecturer Form Modal
function LecturerFormModal({ isOpen, lecturer, onClose, onSuccess }) {
  const supabase = createClient();
  const isEdit = !!lecturer;

  const [formData, setFormData] = useState({
    name: lecturer?.name || "",
    email: lecturer?.email || "",
    bio: lecturer?.bio || "",
    expertise: lecturer?.expertise?.join(", ") || "",
    image_url: lecturer?.image_url || "",
    role: lecturer?.role || "lecturer",
    can_manage_content: lecturer?.can_manage_content || false,
    can_manage_users: lecturer?.can_manage_users || false,
    can_view_analytics: lecturer?.can_view_analytics || false,
    is_active: lecturer?.is_active ?? true,
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const saveData = {
        ...data,
        expertise: data.expertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      if (isEdit) {
        const { error } = await supabase
          .from("lecturers")
          .update(saveData)
          .eq("id", lecturer.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("lecturers").insert([saveData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      onSuccess();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  if (!isOpen) return null;

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
                {isEdit ? "Edit Lecturer" : "Add New Lecturer"}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="John Doe"
                />
              </div>

              <div className="col-span-2">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="lecturer@leadprogram.com"
                />
              </div>

              <div className="col-span-2">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value })
                  }
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl outline-none resize-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Brief bio about the lecturer..."
                />
              </div>

              <div className="col-span-2">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Expertise (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.expertise}
                  onChange={(e) =>
                    setFormData({ ...formData, expertise: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="Leadership, Theology, Communication"
                />
              </div>

              <div className="col-span-2">
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Profile Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({ ...formData, role: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="lecturer">Lecturer</option>
                  <option value="admin">Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>
              </div>

              <div>
                <label
                  className="block text-sm font-semibold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Status
                </label>
                <select
                  value={formData.is_active ? "active" : "inactive"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      is_active: e.target.value === "active",
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl outline-none"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            {/* Permissions */}
            <div
              className="p-4 rounded-xl space-y-3"
              style={{ background: "var(--color-black-elevated)" }}
            >
              <h3
                className="font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Permissions
              </h3>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_manage_content}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_manage_content: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded accent-green-primary"
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Can manage content
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_manage_users}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_manage_users: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded accent-green-primary"
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Can manage users
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.can_view_analytics}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      can_view_analytics: e.target.checked,
                    })
                  }
                  className="w-5 h-5 rounded accent-green-primary"
                />
                <span style={{ color: "var(--text-primary)" }}>
                  Can view analytics
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 rounded-xl font-semibold"
                style={{
                  background: "var(--color-black-elevated)",
                  color: "var(--text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                style={{
                  background: "var(--color-green-primary)",
                  color: "#ffffff",
                }}
              >
                {saveMutation.isPending
                  ? "Saving..."
                  : isEdit
                  ? "Update Lecturer"
                  : "Add Lecturer"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
