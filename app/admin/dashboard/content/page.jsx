// app/admin/dashboard/content/page.jsx

"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  FileText,
  Video,
  Link as LinkIcon,
  ChevronDown,
  Send,
  Eye,
  EyeOff,
} from "lucide-react";

export default function ContentManagementPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Fetch all weeks content
  const { data: weeksData, isLoading } = useQuery({
    queryKey: ["admin-weeks-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("week_content")
        .select(
          `
          *,
          lecturers(id, name, image_url)
        `,
        )
        .order("week_number", { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Get students count per week
  const { data: weekStats } = useQuery({
    queryKey: ["admin-week-stats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("user_week_payments")
        .select("week_number");

      if (error) throw error;

      // Count students per week
      const stats = data.reduce((acc, payment) => {
        const week = payment.week_number;
        acc[week] = (acc[week] || 0) + 1;
        return acc;
      }, {});

      return stats;
    },
  });

  const selectedWeekData = weeksData?.find(
    (w) => w.week_number === selectedWeek,
  );

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
            Week Content Management
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Manage all 52 weeks of LEAD program content
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
          Add Week Content
        </button>
      </div>

      {/* Week Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
        {Array.from({ length: 52 }, (_, i) => i + 1).map((week) => {
          const weekData = weeksData?.find((w) => w.week_number === week);
          const hasContent = !!weekData;
          const isPublished = weekData?.is_published;
          const studentCount = weekStats?.[week] || 0;
          const isSelected = selectedWeek === week;

          return (
            <motion.button
              key={week}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedWeek(week)}
              className="p-4 rounded-xl transition-all relative"
              style={{
                background: isSelected
                  ? "linear-gradient(135deg, #1ed760, #16b455)"
                  : hasContent
                    ? "var(--color-black-surface)"
                    : "var(--color-black-elevated)",
                border: isSelected
                  ? "2px solid #1ed760"
                  : `1px solid ${
                      hasContent
                        ? "var(--color-green-primary)"
                        : "var(--color-black-border)"
                    }`,
                color: isSelected ? "#ffffff" : "var(--text-primary)",
              }}
            >
              {/* Status Indicator */}
              {hasContent && !isSelected && (
                <div
                  className="absolute top-2 right-2 w-2 h-2 rounded-full"
                  style={{
                    background: isPublished
                      ? "var(--color-green-primary)"
                      : "#f59e0b",
                  }}
                />
              )}

              <div className="text-2xl font-bold mb-1">
                {week < 10 ? `0${week}` : week}
              </div>
              <div className="text-xs opacity-80">
                {studentCount > 0 ? `${studentCount} students` : "No students"}
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* Week Details */}
      {selectedWeekData ? (
        <WeekContentDetail
          weekData={selectedWeekData}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onUpdate={() => {
            queryClient.invalidateQueries(["admin-weeks-content"]);
            setIsEditing(false);
          }}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card p-12 rounded-xl text-center"
        >
          <BookOpen
            className="w-16 h-16 mx-auto mb-4"
            style={{ color: "var(--text-muted)" }}
          />
          <h3
            className="text-xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            No Content for Week {selectedWeek}
          </h3>
          <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
            This week doesn't have any content yet. Add content to get started.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold"
            style={{
              background: "var(--color-green-primary)",
              color: "#ffffff",
            }}
          >
            <Plus className="w-5 h-5" />
            Add Week {selectedWeek} Content
          </button>
        </motion.div>
      )}

      {/* Add Week Modal */}
      <AddWeekModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        weekNumber={selectedWeek}
        onSuccess={() => {
          queryClient.invalidateQueries(["admin-weeks-content"]);
          setShowAddModal(false);
        }}
      />
    </div>
  );
}

// Week Content Detail Component
function WeekContentDetail({ weekData, isEditing, setIsEditing, onUpdate }) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: weekData.title || "",
    summary: weekData.summary || "",
    telegram_link: weekData.telegram_link || "",
    resources: weekData.resources || [],
    lecturer_id: weekData.lecturer_id || "",
    is_published: weekData.is_published || false,
  });

  // Fetch lecturers for dropdown
  const { data: lecturers } = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
  });

  // Update week mutation
  const updateMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from("week_content")
        .update(data)
        .eq("id", weekData.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-weeks-content"]);
      onUpdate();
    },
  });

  const handleSave = () => {
    updateMutation.mutate(formData);
  };

  const addResource = () => {
    setFormData({
      ...formData,
      resources: [
        ...formData.resources,
        { title: "", url: "", type: "article" },
      ],
    });
  };

  const updateResource = (index, field, value) => {
    const newResources = [...formData.resources];
    newResources[index][field] = value;
    setFormData({ ...formData, resources: newResources });
  };

  const removeResource = (index) => {
    setFormData({
      ...formData,
      resources: formData.resources.filter((_, i) => i !== index),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "var(--color-black-border)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #1ed760, #16b455)",
            }}
          >
            <span className="text-white font-bold text-lg">
              {weekData.week_number}
            </span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2
                className="text-xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Week {weekData.week_number}
                {!isEditing && ` - ${weekData.title}`}
              </h2>
              <div
                className="px-2 py-1 rounded-full text-xs font-bold"
                style={{
                  background: weekData.is_published ? "#1ed76020" : "#f59e0b20",
                  color: weekData.is_published ? "#1ed760" : "#f59e0b",
                }}
              >
                {weekData.is_published ? "Published" : "Draft"}
              </div>
            </div>
            {weekData.lecturers && (
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Lecturer: {weekData.lecturers.name}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    title: weekData.title || "",
                    summary: weekData.summary || "",
                    telegram_link: weekData.telegram_link || "",
                    resources: weekData.resources || [],
                    lecturer_id: weekData.lecturer_id || "",
                    is_published: weekData.is_published || false,
                  });
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold"
                style={{
                  background: "var(--color-black-elevated)",
                  color: "var(--text-primary)",
                }}
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold disabled:opacity-50"
                style={{
                  background: "var(--color-green-primary)",
                  color: "#ffffff",
                }}
              >
                <Save className="w-5 h-5" />
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold"
              style={{
                background: "var(--color-green-primary)",
                color: "#ffffff",
              }}
            >
              <Edit className="w-5 h-5" />
              Edit Content
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Title */}
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Week Title
          </label>
          {isEditing ? (
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: "var(--color-black-elevated)",
                border: "1px solid var(--color-black-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Enter week title..."
            />
          ) : (
            <p
              className="text-lg font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              {weekData.title}
            </p>
          )}
        </div>

        {/* Summary */}
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Summary
          </label>
          {isEditing ? (
            <textarea
              value={formData.summary}
              onChange={(e) =>
                setFormData({ ...formData, summary: e.target.value })
              }
              rows={5}
              className="w-full px-4 py-3 rounded-xl outline-none resize-none"
              style={{
                background: "var(--color-black-elevated)",
                border: "1px solid var(--color-black-border)",
                color: "var(--text-primary)",
              }}
              placeholder="Enter week summary..."
            />
          ) : (
            <div
              className="card-elevated p-4 rounded-xl"
            >
              <p
                style={{
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                }}
              >
                {weekData.summary || "No summary available"}
              </p>
            </div>
          )}
        </div>

        {/* Telegram Link */}
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Telegram Group Link
          </label>
          {isEditing ? (
            <div className="flex items-center gap-2">
              <Send
                className="w-5 h-5"
                style={{ color: "var(--text-muted)" }}
              />
              <input
                type="url"
                value={formData.telegram_link}
                onChange={(e) =>
                  setFormData({ ...formData, telegram_link: e.target.value })
                }
                className="flex-1 px-4 py-3 rounded-xl outline-none"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="https://t.me/..."
              />
            </div>
          ) : (
            <>
              {weekData.telegram_link ? (
                <a
                  href={weekData.telegram_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm font-semibold"
                  style={{ color: "var(--color-green-primary)" }}
                >
                  <Send className="w-4 h-4" />
                  {weekData.telegram_link}
                </a>
              ) : (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No Telegram link set
                </p>
              )}
            </>
          )}
        </div>

        {/* Lecturer Selection */}
        <div>
          <label
            className="block text-sm font-semibold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Assigned Lecturer
          </label>
          {isEditing ? (
            <select
              value={formData.lecturer_id}
              onChange={(e) =>
                setFormData({ ...formData, lecturer_id: e.target.value })
              }
              className="w-full px-4 py-3 rounded-xl outline-none"
              style={{
                background: "var(--color-black-elevated)",
                border: "1px solid var(--color-black-border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">Select a lecturer...</option>
              {lecturers?.map((lecturer) => (
                <option key={lecturer.id} value={lecturer.id}>
                  {lecturer.name}
                </option>
              ))}
            </select>
          ) : (
            <div className="flex items-center gap-3">
              {weekData.lecturers?.image_url && (
                <img
                  src={weekData.lecturers.image_url}
                  alt={weekData.lecturers.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <span style={{ color: "var(--text-primary)" }}>
                {weekData.lecturers?.name || "Not assigned"}
              </span>
            </div>
          )}
        </div>

        {/* Resources */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label
              className="text-sm font-semibold"
              style={{ color: "var(--text-primary)" }}
            >
              Resources
            </label>
            {isEditing && (
              <button
                onClick={addResource}
                className="flex items-center gap-1 text-sm font-semibold"
                style={{ color: "var(--color-green-primary)" }}
              >
                <Plus className="w-4 h-4" />
                Add Resource
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              {formData.resources.map((resource, index) => (
                <div
                  key={index}
                  className="card p-4 rounded-xl space-y-2"
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={resource.title}
                      onChange={(e) =>
                        updateResource(index, "title", e.target.value)
                      }
                      className="flex-1 px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: "var(--color-black-base)",
                        border: "1px solid var(--color-black-border)",
                        color: "var(--text-primary)",
                      }}
                      placeholder="Resource title..."
                    />
                    <select
                      value={resource.type}
                      onChange={(e) =>
                        updateResource(index, "type", e.target.value)
                      }
                      className="px-3 py-2 rounded-lg outline-none"
                      style={{
                        background: "var(--color-black-base)",
                        border: "1px solid var(--color-black-border)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <option value="article">Article</option>
                      <option value="video">Video</option>
                      <option value="pdf">PDF</option>
                      <option value="link">Link</option>
                    </select>
                    <button
                      onClick={() => removeResource(index)}
                      className="p-2 rounded-lg"
                      style={{
                        background: "#ef444420",
                        color: "#ef4444",
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="url"
                    value={resource.url}
                    onChange={(e) =>
                      updateResource(index, "url", e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-lg outline-none"
                    style={{
                      background: "var(--color-black-base)",
                      border: "1px solid var(--color-black-border)",
                      color: "var(--text-primary)",
                    }}
                    placeholder="Resource URL..."
                  />
                </div>
              ))}
              {formData.resources.length === 0 && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No resources added yet
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {weekData.resources?.map((resource, index) => (
                <a
                  key={index}
                  href={resource.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-interactive flex items-center gap-3 p-3 rounded-xl transition-all"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ background: "var(--color-green-primary)20" }}
                  >
                    {resource.type === "video" ? (
                      <Video
                        className="w-5 h-5"
                        style={{ color: "var(--color-green-primary)" }}
                      />
                    ) : resource.type === "pdf" ? (
                      <FileText
                        className="w-5 h-5"
                        style={{ color: "var(--color-green-primary)" }}
                      />
                    ) : (
                      <LinkIcon
                        className="w-5 h-5"
                        style={{ color: "var(--color-green-primary)" }}
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p
                      className="font-semibold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      {resource.title}
                    </p>
                    <p
                      className="text-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {resource.type}
                    </p>
                  </div>
                  <ChevronDown
                    className="w-5 h-5 -rotate-90"
                    style={{ color: "var(--text-muted)" }}
                  />
                </a>
              ))}
              {(!weekData.resources || weekData.resources.length === 0) && (
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  No resources
                </p>
              )}
            </div>
          )}
        </div>

        {/* Published Status */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_published}
              onChange={(e) =>
                setFormData({ ...formData, is_published: e.target.checked })
              }
              disabled={!isEditing}
              className="w-5 h-5 rounded accent-green-primary"
            />
            <div>
              <span
                className="font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                Publish this week
              </span>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Make this week visible to students
              </p>
            </div>
          </label>
        </div>
      </div>
    </motion.div>
  );
}

// Add Week Modal Component
function AddWeekModal({ isOpen, onClose, weekNumber, onSuccess }) {
  const supabase = createClient();
  const [formData, setFormData] = useState({
    week_number: weekNumber,
    title: "",
    summary: "",
    telegram_link: "",
    resources: [],
    lecturer_id: "",
    is_published: false,
  });
  useEffect(() => {
    if (isOpen) {
      setFormData((prev) => ({
        ...prev,
        week_number: weekNumber,
      }));
    }
  }, [weekNumber, isOpen]);

  // Fetch lecturers
  const { data: lecturers } = useQuery({
    queryKey: ["lecturers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lecturers")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data;
    },
    enabled: isOpen,
  });

  // Create week mutation
  const createMutation = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase.from("week_content").insert([data]);
      if (error) throw error;
    },
    onSuccess: () => {
      onSuccess();
      // Reset form
      setFormData({
        week_number: weekNumber,
        title: "",
        summary: "",
        telegram_link: "",
        resources: [],
        lecturer_id: "",
        is_published: true,
      });
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formdata is", formData);
    createMutation.mutate(formData);
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
          className="card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
        >
          {/* Header */}
          <div
            className="sticky top-0 px-6 py-4 border-b border-(--color-black-border) backdrop-blur-lg bg-(--color-black-surface)"
          >
            <div className="flex items-center justify-between">
              <h2
                className="text-2xl font-bold"
                style={{ color: "var(--text-primary)" }}
              >
                Add Week {weekNumber} Content
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
            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Week Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Enter week title..."
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Summary *
              </label>
              <textarea
                required
                value={formData.summary}
                onChange={(e) =>
                  setFormData({ ...formData, summary: e.target.value })
                }
                rows={5}
                className="w-full px-4 py-3 rounded-xl outline-none resize-none"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="Enter week summary..."
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Telegram Group Link
              </label>
              <input
                type="url"
                value={formData.telegram_link}
                onChange={(e) =>
                  setFormData({ ...formData, telegram_link: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
                placeholder="https://t.me/..."
              />
            </div>

            <div>
              <label
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Assign Lecturer
              </label>
              <select
                value={formData.lecturer_id}
                onChange={(e) =>
                  setFormData({ ...formData, lecturer_id: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{
                  background: "var(--color-black-elevated)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
              >
                <option value="">Select a lecturer...</option>
                {lecturers?.map((lecturer) => (
                  <option key={lecturer.id} value={lecturer.id}>
                    {lecturer.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_published}
                  onChange={(e) =>
                    setFormData({ ...formData, is_published: e.target.checked })
                  }
                  className="w-5 h-5 rounded accent-green-primary"
                />
                <div>
                  <span
                    className="font-semibold"
                    style={{ color: "var(--text-primary)" }}
                  >
                    Publish immediately
                  </span>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Make this week visible to students
                  </p>
                </div>
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
                disabled={createMutation.isPending}
                className="px-6 py-3 rounded-xl font-semibold disabled:opacity-50"
                style={{
                  background: "var(--color-green-primary)",
                  color: "#ffffff",
                }}
              >
                {createMutation.isPending
                  ? "Creating..."
                  : "Create Week Content"}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
