// app/profile/components/calendar/WeekDetailModal.jsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { useProfileStore } from "@/lib/store/profile-store";
import { Lock, Unlock, ExternalLink, BookOpen, MessageCircle, PenLine, ChevronRight } from "lucide-react";
import {
  useWeekContent,
  useWeekNotes,
  useSaveWeekNotes,
} from "@/hooks/use-profile";

// Generate confetti pieces once — not on every frame
function useConfettiPieces() {
  return useMemo(() => {
    if (typeof window === "undefined") return [];
    return Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 10 + 5,
      rotate: Math.random() * 360,
      color: ["#1ed760", "#ffd700", "#ff6b6b", "#4ecdc4", "#ff9ff3"][
        Math.floor(Math.random() * 5)
      ],
      isCircle: Math.random() > 0.5,
    }));
  }, []);
}

export default function WeekDetailModal({ weekNumber, profile, isUnlocked }) {
  const { closeWeekModal } = useProfileStore();
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const confettiPieces = useConfettiPieces();

  const { data: weekContent, isLoading: contentLoading } =
    useWeekContent(weekNumber);
  const { data: weekNotes } = useWeekNotes(profile?.user_id, weekNumber);
  const saveNotesMutation = useSaveWeekNotes();

  // Close on Escape key (U3)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") closeWeekModal();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeWeekModal]);

  // Initialize notes from saved data
  useEffect(() => {
    if (weekNotes?.notes) {
      setNotes(weekNotes.notes);
    }
  }, [weekNotes]);

  // Reset success message after 3 seconds
  useEffect(() => {
    if (saveSuccess) {
      const timer = setTimeout(() => setSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [saveSuccess]);

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
      setSaveSuccess(true);
    } catch (error) {
      console.error("Failed to save notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleScrollToPayment = () => {
    closeWeekModal();
    // Give the modal exit animation time to complete before scrolling
    setTimeout(() => {
      document.getElementById("payment-widget")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 200);
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

      {/* Save success toast */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-60 px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3"
            style={{
              background: "linear-gradient(135deg, #1ed760, #16b455)",
              boxShadow: "0 10px 40px rgba(30, 215, 96, 0.4)",
            }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            >
              <PenLine className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <p className="text-white font-semibold text-lg">Notes Saved</p>
              <p className="text-white/80 text-sm">Your progress is being tracked</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: 24 }}
        transition={{ type: "spring", stiffness: 400, damping: 32 }}
        className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-3xl z-50 overflow-hidden rounded-2xl"
        style={{
          background: "var(--surface)",
          boxShadow: "var(--shadow-modal)",
          maxHeight: "90vh",
        }}
      >
        {/* Header */}
        <div
          className="relative p-6 border-b"
          style={{
            background: isUnlocked
              ? "linear-gradient(135deg, #142b1c, var(--surface))"
              : "var(--elevated)",
            borderColor: "var(--color-black-border)",
          }}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-1">
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}
                >
                  Week {weekNumber}
                </span>
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
                  style={{
                    background: isUnlocked ? "rgba(30,215,96,0.15)" : "rgba(255,255,255,0.06)",
                    color: isUnlocked ? "#1ed760" : "var(--text-muted)",
                    border: isUnlocked ? "1px solid rgba(30,215,96,0.3)" : "1px solid rgba(255,255,255,0.08)",
                  }}
                >
                  {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isUnlocked ? "Unlocked" : "Locked"}
                </span>
              </div>

              {contentLoading ? (
                <div
                  className="h-7 w-48 rounded-lg animate-pulse mt-1"
                  style={{ background: "var(--color-black-border)" }}
                />
              ) : (
                <h2
                  className="text-2xl font-bold leading-snug"
                  style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
                >
                  {weekContent?.title || `Week ${weekNumber}`}
                </h2>
              )}
            </div>

            <button
              onClick={closeWeekModal}
              className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 shrink-0"
              style={{
                background: "var(--color-black-border)",
                color: "var(--text-secondary)",
              }}
              aria-label="Close week details"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto" style={{ maxHeight: "calc(90vh - 160px)" }}>

          {/* Loading skeleton (U6) */}
          {contentLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-xl animate-pulse"
                  style={{ background: "var(--elevated)" }}
                />
              ))}
            </div>
          ) : isUnlocked ? (
            /* Unlocked content */
            <div className="p-6 space-y-6">
              {/* Lecturer Info (E10) */}
              {weekContent?.lecturer && (
                <div
                  className="flex items-center gap-4 p-4 rounded-2xl"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--color-black-border)",
                  }}
                >
                  <div className="w-12 h-12 rounded-full overflow-hidden shrink-0">
                    {weekContent.lecturer.image_url ? (
                      <img
                        src={weekContent.lecturer.image_url}
                        alt={weekContent.lecturer.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center font-bold"
                        style={{ background: "linear-gradient(135deg, #1ed760, #16b455)", color: "#062010" }}
                      >
                        {weekContent.lecturer.name?.[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold" style={{ color: "var(--text-primary)" }}>
                      {weekContent.lecturer.name}
                    </div>
                    {weekContent.lecturer.expertise?.length > 0 && (
                      <div className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {weekContent.lecturer.expertise.slice(0, 2).join(" · ")}
                      </div>
                    )}
                    {weekContent.lecturer.bio && (
                      <p
                        className="text-sm mt-1 line-clamp-2"
                        style={{ color: "var(--text-muted)", lineHeight: "1.6" }}
                      >
                        {weekContent.lecturer.bio}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Week Summary (E8) */}
              {weekContent?.summary && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4" style={{ color: "#1ed760" }} />
                    <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      Week Summary
                    </h3>
                  </div>
                  <div
                    className="p-4 rounded-2xl text-sm"
                    style={{
                      background: "var(--elevated)",
                      border: "1px solid var(--color-black-border)",
                      color: "var(--text-secondary)",
                      lineHeight: "1.75",
                    }}
                  >
                    {weekContent.summary}
                  </div>
                </div>
              )}

              {/* Resources */}
              {weekContent?.resources?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <ExternalLink className="w-4 h-4" style={{ color: "#3b82f6" }} />
                    <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      Resources
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {weekContent.resources.map((resource, idx) => (
                      <a
                        key={idx}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.01]"
                        style={{
                          background: "var(--elevated)",
                          border: "1px solid var(--color-black-border)",
                          color: "var(--text-primary)",
                        }}
                      >
                        <ExternalLink className="w-4 h-4 shrink-0" style={{ color: "#3b82f6" }} />
                        <span className="text-sm font-medium flex-1">{resource.title || resource.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Telegram Link */}
              {weekContent?.telegram_link && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <MessageCircle className="w-4 h-4" style={{ color: "#0088cc" }} />
                    <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                      Join Week {weekNumber} Group
                    </h3>
                  </div>
                  <a
                    href={weekContent.telegram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 rounded-2xl transition-all hover:scale-[1.01] hover:brightness-110"
                    style={{
                      background: "linear-gradient(135deg, #0088cc, #006699)",
                      color: "#ffffff",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                        </svg>
                      </div>
                      <div>
                        <div className="font-semibold">Telegram Group</div>
                        <div className="text-sm opacity-80">Join the live discussion</div>
                      </div>
                    </div>
                    <ExternalLink className="w-5 h-5 opacity-80" />
                  </a>
                </div>
              )}

              {/* Personal Notes */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <PenLine className="w-4 h-4" style={{ color: "#f59e0b" }} />
                  <h3 className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                    My Learning Notes
                  </h3>
                </div>
                <motion.div
                  animate={saveSuccess ? { scale: [1, 1.01, 1] } : {}}
                  transition={{ duration: 0.3 }}
                >
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="What did you learn this week? Key takeaways, ideas, questions..."
                    className="w-full h-36 p-4 rounded-xl resize-none focus:outline-none transition-all text-sm"
                    style={{
                      background: "var(--elevated)",
                      border: saveSuccess
                        ? "1.5px solid #1ed760"
                        : "1px solid var(--color-black-border)",
                      color: "var(--text-primary)",
                      lineHeight: "1.7",
                      boxShadow: saveSuccess ? "0 0 16px rgba(30, 215, 96, 0.12)" : "none",
                    }}
                  />
                </motion.div>
                <div className="flex justify-between items-center mt-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {notes.length} characters
                    </span>
                    <AnimatePresence>
                      {saveSuccess && (
                        <motion.span
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 8 }}
                          className="text-xs font-semibold"
                          style={{ color: "#1ed760" }}
                        >
                          Saved
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    onClick={handleSaveNotes}
                    disabled={!notes.trim() || isSaving}
                    whileHover={notes.trim() && !isSaving ? { scale: 1.04 } : {}}
                    whileTap={notes.trim() && !isSaving ? { scale: 0.96 } : {}}
                    className="px-5 py-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: notes.trim()
                        ? "linear-gradient(135deg, #1ed760, #16b455)"
                        : "var(--color-black-border)",
                      color: notes.trim() ? "#062010" : "var(--text-muted)",
                    }}
                  >
                    {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Notes"}
                  </motion.button>
                </div>
              </div>
            </div>
          ) : (
            /* Locked state — show teaser + CTA (U1 + E3) */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 space-y-6"
            >
              {/* Lock visual */}
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
                  style={{
                    background: "var(--elevated)",
                    border: "1px solid var(--color-black-border)",
                  }}
                >
                  <Lock className="w-7 h-7" style={{ color: "var(--text-muted)" }} />
                </motion.div>
                <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                  This week is locked
                </p>
              </div>

              {/* Week teaser card */}
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{
                  background: "var(--elevated)",
                  border: "1px solid var(--color-black-border)",
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="w-4 h-4" style={{ color: "#1ed760" }} />
                  <span className="text-sm font-semibold" style={{ color: "var(--text-secondary)" }}>
                    What you'll learn
                  </span>
                </div>

                {weekContent?.summary ? (
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
                  >
                    {weekContent.summary.slice(0, 180)}
                    {weekContent.summary.length > 180 && (
                      <span style={{ color: "var(--text-muted)" }}>… unlock to read more</span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Unlock this week to access the full curriculum content and join the Telegram discussion group.
                  </p>
                )}

                {weekContent?.lecturer && (
                  <div
                    className="flex items-center gap-3 pt-3"
                    style={{ borderTop: "1px solid var(--color-black-border)" }}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                      {weekContent.lecturer.image_url ? (
                        <img
                          src={weekContent.lecturer.image_url}
                          alt={weekContent.lecturer.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center text-xs font-bold"
                          style={{ background: "linear-gradient(135deg, #1ed760, #16b455)", color: "#062010" }}
                        >
                          {weekContent.lecturer.name?.[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        {weekContent.lecturer.name}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {weekContent.lecturer.expertise?.[0] || "Instructor"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Unlock CTA */}
              <button
                onClick={handleScrollToPayment}
                className="w-full py-4 rounded-2xl font-bold text-base flex items-center justify-center gap-2 transition-all hover:brightness-110 active:scale-[0.98]"
                style={{
                  background: "linear-gradient(135deg, #1ed760, #16b455)",
                  color: "#062010",
                  boxShadow: "0 4px 20px rgba(30, 215, 96, 0.3)",
                }}
              >
                <Unlock className="w-5 h-5" />
                Unlock Week {weekNumber}
                <ChevronRight className="w-4 h-4 ml-auto" />
              </button>
            </motion.div>
          )}
        </div>
      </motion.div>
    </>
  );
}
