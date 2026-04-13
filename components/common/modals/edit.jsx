// components/modals/EditProfileModal.jsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";

export default function EditProfileModal({ isOpen, onClose, profile }) {
  const supabase = useMemo(() => createClient(), []);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    first_name: profile?.first_name || "",
    last_name: profile?.last_name || "",
    middle_name: profile?.middle_name || "",
    phone_number: profile?.phone_number || "",
    city: profile?.city || "",
    telegram_phone: profile?.telegram_phone || "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Re-sync form when profile prop changes (e.g. after external update or modal reopen)
  useEffect(() => {
    setFormData({
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      middle_name: profile?.middle_name || "",
      phone_number: profile?.phone_number || "",
      city: profile?.city || "",
      telegram_phone: profile?.telegram_phone || "",
    });
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async (data) => {
      const { error } = await supabase
        .from("students")
        .update(data)
        .eq("user_id", profile.user_id);

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["user-profile"]);
      onClose();
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile.mutate(formData);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/profile/upload-picture", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const { error } = await res.json();
        throw new Error(error || "Upload failed");
      }

      queryClient.invalidateQueries(["user-profile"]);
    } catch (error) {
      console.error("Upload error:", error);
      setUploadError("Failed to upload image. Please try a different file.");
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {/* Backdrop */}
      <motion.div
        key="edit-profile-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        key="edit-profile-modal"
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl z-50 rounded-2xl overflow-hidden"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-modal)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="p-6 border-b border-(--color-black-border) flex items-center justify-between"
          style={{ background: "var(--elevated)" }}
        >
          <h2
            className="text-2xl font-bold"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            Edit Profile
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{
              background: "var(--color-black-border)",
              color: "var(--text-secondary)",
            }}
            aria-label="Close edit profile"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 140px)" }}
        >
          {/* Profile Picture */}
          <div className="mb-6 text-center">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full overflow-hidden mx-auto mb-3">
                {profile?.profile_picture_url ? (
                  <Image
                    src={profile.profile_picture_url}
                    alt="Profile"
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center text-2xl font-bold"
                    style={{
                      background: "#1ed760",
                      color: "#ffffff",
                    }}
                  >
                    {profile?.first_name?.[0]}
                    {profile?.last_name?.[0]}
                  </div>
                )}
              </div>
              <label
                htmlFor="profile-picture"
                className="absolute bottom-3 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-110"
                style={{
                  background: "#1ed760",
                  color: "#ffffff",
                }}
              >
                {isUploading ? (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                )}
              </label>
              <input
                id="profile-picture"
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploading}
              />
            </div>
          </div>

          {/* Upload Error */}
          {uploadError && (
            <div
              className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-start gap-2"
              role="alert"
            >
              <svg
                className="w-4 h-4 text-red-500 mt-0.5 shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-500">{uploadError}</p>
            </div>
          )}

          {/* Form Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                First Name *
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) =>
                  setFormData({ ...formData, first_name: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Last Name *
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) =>
                  setFormData({ ...formData, last_name: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Middle Name
              </label>
              <input
                type="text"
                value={formData.middle_name}
                onChange={(e) =>
                  setFormData({ ...formData, middle_name: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.phone_number}
                onChange={(e) =>
                  setFormData({ ...formData, phone_number: e.target.value })
                }
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-secondary)" }}
              >
                Telegram Phone *
              </label>
              <input
                type="tel"
                value={formData.telegram_phone}
                onChange={(e) =>
                  setFormData({ ...formData, telegram_phone: e.target.value })
                }
                required
                className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-primary/30 focus:border-green-primary border border-(--color-black-border) transition-colors"
                style={{
                  background: "var(--elevated)",
                  color: "var(--text-primary)",
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105"
              style={{
                background: "var(--color-black-surface)",
                border: "1px solid var(--color-black-border)",
                color: "var(--text-secondary)",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateProfile.isPending}
              className="flex-1 px-6 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
              style={{
                background: "#1ed760",
                color: "#ffffff",
              }}
            >
              {updateProfile.isPending ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </motion.div>
    </AnimatePresence>
  );
}
