// app/profile/components/DeleteAccountModal.jsx

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DeleteAccountModal({ isOpen, onClose, profile }) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleDelete = async () => {
    if (confirmText !== "DELETE") {
      setError('Please type "DELETE" to confirm');
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      // Call delete account API
      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete account");
      }

      // Sign out and redirect
      await supabase.auth.signOut();
      router.push("/?deleted=true");
    } catch (error) {
      console.error("Delete account error:", error);
      setError(error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-md z-50 rounded-2xl p-6"
            style={{
              background: "var(--color-black-base)",
              border: "1px solid #ef4444",
            }}
          >
            {/* Icon */}
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-500/20 flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>

            {/* Title */}
            <h2
              className="text-2xl font-bold text-center mb-2"
              style={{ color: "var(--text-primary)" }}
            >
              Delete Account
            </h2>

            {/* Description */}
            <p
              className="text-center mb-6"
              style={{ color: "var(--text-secondary)" }}
            >
              This action cannot be undone. This will permanently delete your
              account and remove all your data from our servers.
            </p>

            {/* Warning List */}
            <div
              className="p-4 rounded-xl mb-6"
              style={{
                background: "var(--color-black-surface)",
                border: "1px solid var(--color-black-border)",
              }}
            >
              <p className="font-semibold mb-2" style={{ color: "#ef4444" }}>
                You will lose:
              </p>
              <ul
                className="space-y-1 text-sm"
                style={{ color: "var(--text-secondary)" }}
              >
                <li>• All your learning progress</li>
                <li>• Unlocked weeks and content access</li>
                <li>• Your personal notes and achievements</li>
                <li>• Payment history and receipts</li>
              </ul>
            </div>

            {/* Confirmation Input */}
            <div className="mb-6">
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Type <strong>DELETE</strong> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value.toUpperCase())}
                placeholder="DELETE"
                className="w-full px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                style={{
                  background: "var(--color-black-surface)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500"
              >
                <p className="text-sm text-red-500">{error}</p>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isDeleting}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50"
                style={{
                  background: "var(--color-black-surface)",
                  border: "1px solid var(--color-black-border)",
                  color: "var(--text-primary)",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting || confirmText !== "DELETE"}
                className="flex-1 px-4 py-3 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "#ef4444",
                  color: "#ffffff",
                }}
              >
                {isDeleting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
                    Deleting...
                  </span>
                ) : (
                  "Delete Account"
                )}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
