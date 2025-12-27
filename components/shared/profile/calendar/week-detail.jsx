// app/profile/components/calendar/WeekDetailModal.jsx

"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { useProfileStore } from "@/lib/store/profile-store";
import {
  useWeekContent,
  useWeekNotes,
  useSaveWeekNotes,
} from "@/hooks/use-profile";

export default function WeekDetailModal({ weekNumber, profile, isUnlocked }) {
  const { closeWeekModal } = useProfileStore();
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const { data: weekContent, isLoading: contentLoading } =
    useWeekContent(weekNumber);
  const { data: weekNotes } = useWeekNotes(profile?.user_id, weekNumber);
  const saveNotesMutation = useSaveWeekNotes();

  // Initialize notes from saved data
  useState(() => {
    if (weekNotes?.notes) {
      setNotes(weekNotes.notes);
    }
  }, [weekNotes]);

  const handleSaveNotes = async () => {
    if (!notes.trim()) return;

    setIsSaving(true);
    try {
      await saveNotesMutation.mutateAsync({
        userId: profile.user_id,
        studentId: profile.id,
        weekNumber,
        notes: notes.trim(),
      });
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={closeWeekModal}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl z-50 overflow-hidden rounded-2xl"
        style={{
          background: "var(--color-black-base)",
          border: "1px solid var(--color-black-border)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="relative p-6 border-b"
          style={{
            background: isUnlocked
              ? "linear-gradient(135deg, #145a32, #0a0d12)"
              : "var(--color-black-surface)",
            borderColor: "var(--color-black-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2
                className="text-3xl font-bold mb-1"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  color: "var(--text-primary)",
                }}
              >
                Week {weekNumber}
              </h2>
              {weekContent?.title && (
                <p style={{ color: "var(--text-secondary)" }}>
                  {weekContent.title}
                </p>
              )}
            </div>

            <button
              onClick={closeWeekModal}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{
                background: "var(--color-black-border)",
                color: "var(--text-secondary)",
              }}
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
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

          {/* Status Badge */}
          <div className="mt-4">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold"
              style={{
                background: isUnlocked
                  ? "#1ed760"
                  : "var(--color-black-border)",
                color: isUnlocked ? "#ffffff" : "var(--text-muted)",
              }}
            >
              {isUnlocked ? (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Unlocked
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  Locked
                </>
              )}
            </span>
          </div>
        </div>

        {/* Content */}
        <div
          className="overflow-y-auto"
          style={{ maxHeight: "calc(90vh - 200px)" }}
        >
          <div className="p-6 space-y-6">
            {!isUnlocked ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-12"
              >
                <div className="text-6xl mb-4">🔒</div>
                <h3
                  className="text-2xl font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  Week {weekNumber} is Locked
                </h3>
                <p className="mb-6" style={{ color: "var(--text-secondary)" }}>
                  Unlock this week to access the content and join the Telegram
                  group
                </p>
                <button
                  className="px-8 py-3 rounded-xl font-semibold transition-all hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #1ed760, #16b455)",
                    color: "#ffffff",
                  }}
                >
                  Unlock Week {weekNumber}
                </button>
              </motion.div>
            ) : (
              <>
                {/* Lecturer Info */}
                {weekContent?.lecturer && (
                  <div
                    className="flex items-center gap-4 p-4 rounded-xl"
                    style={{
                      background: "var(--color-black-surface)",
                      border: "1px solid var(--color-black-border)",
                    }}
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden">
                      <img
                        src={weekContent.lecturer.image_url}
                        alt={weekContent.lecturer.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div
                        className="font-semibold"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {weekContent.lecturer.name}
                      </div>
                      <div
                        className="text-sm"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        Lead Instructor
                      </div>
                    </div>
                  </div>
                )}

                {/* Week Summary */}
                {weekContent?.summary && (
                  <div>
                    <h3
                      className="text-xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span>📚</span> Week Summary
                    </h3>
                    <div
                      className="p-4 rounded-xl"
                      style={{
                        background: "var(--color-black-surface)",
                        border: "1px solid var(--color-black-border)",
                        color: "var(--text-secondary)",
                        lineHeight: "1.7",
                      }}
                    >
                      {weekContent.summary}
                    </div>
                  </div>
                )}

                {/* Telegram Link */}
                {weekContent?.telegram_link && (
                  <div>
                    <h3
                      className="text-xl font-bold mb-3 flex items-center gap-2"
                      style={{ color: "var(--text-primary)" }}
                    >
                      <span>💬</span> Join Week {weekNumber} Group
                    </h3>
                    <a
                      href={weekContent.telegram_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl transition-all hover:scale-[1.02]"
                      style={{
                        background: "linear-gradient(135deg, #0088cc, #006699)",
                        color: "#ffffff",
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                          <svg
                            className="w-6 h-6"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold">Telegram Group</div>
                          <div className="text-sm opacity-80">
                            Click to join the discussion
                          </div>
                        </div>
                      </div>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </div>
                )}

                {/* Personal Notes */}
                <div>
                  <h3
                    className="text-xl font-bold mb-3 flex items-center gap-2"
                    style={{ color: "var(--text-primary)" }}
                  >
                    <span>✍️</span> My Learning Notes
                  </h3>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you learn this week? Write your key takeaways here..."
                    className="w-full h-40 p-4 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#1ed760] transition-all"
                    style={{
                      background: "var(--color-black-surface)",
                      border: "1px solid var(--color-black-border)",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-satoshi)",
                    }}
                  />
                  <div className="flex justify-between items-center mt-3">
                    <span
                      className="text-sm"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {notes.length} characters
                    </span>
                    <button
                      onClick={handleSaveNotes}
                      disabled={!notes.trim() || isSaving}
                      className="px-6 py-2 rounded-lg font-semibold transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: notes.trim()
                          ? "linear-gradient(135deg, #1ed760, #16b455)"
                          : "var(--color-black-border)",
                        color: notes.trim() ? "#ffffff" : "var(--text-muted)",
                      }}
                    >
                      {isSaving ? "Saving..." : "Save Notes"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}
