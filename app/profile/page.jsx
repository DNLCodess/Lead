// app/profile/page.jsx

"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-profile";
import { useProfileStore } from "@/lib/store/profile-store";
import { useQueryClient } from "@tanstack/react-query";
import LecturersTab from "@/components/shared/profile/tab/lecturers";
import OverviewTab from "@/components/shared/profile/tab/overview";
import CalendarTab from "@/components/shared/profile/tab/calendar";
import ScoresTab from "@/components/shared/profile/tab/scores";
import ProfileTabs from "@/components/shared/profile/tabs";
import ProfileHeader from "@/components/shared/profile/header";
import PendingPaymentsAlert from "@/components/shared/profile/PendingPaymentsAlert";
import ExamReminderBanner from "@/components/shared/profile/ExamReminderBanner";

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeTab, setActiveTab } = useProfileStore();

  const { data: profile, isLoading: profileLoading, isError: profileError } = useUserProfile(userId);

  // ✅ Sync URL params with store on mount
  useEffect(() => {
    const tabParam = searchParams.get("tab");
    const validTabs = ["overview", "calendar", "lecturers", "scores"];
    if (tabParam && validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams, setActiveTab]);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push("/auth/login");
          return;
        }

        setUserId(user.id);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/auth/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle profile update from edit modal
  const handleProfileUpdate = () => {
    queryClient.invalidateQueries(["user-profile", userId]);
  };

  // Loading state
  if (isLoading || profileLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--background)" }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 rounded-full mx-auto mb-4"
            style={{
              border: "4px solid var(--color-black-border)",
              borderTopColor: "#1ed760",
            }}
          />
          <p
            className="text-lg font-semibold"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-secondary)",
            }}
          >
            Loading your profile...
          </p>
        </motion.div>
      </div>
    );
  }

  // Profile fetch error
  if (profileError) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-4"
        style={{ background: "var(--background)" }}
      >
        <div className="text-center max-w-sm">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
          >
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>
            Could not load your profile
          </h2>
          <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
            There was a problem fetching your data. Please check your connection and try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl font-semibold text-sm"
            style={{ background: "var(--color-green-primary)", color: "#0a0d12" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render profile
  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Background Gradient */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(30, 215, 96, 0.15), transparent 60%)",
        }}
      />

      {/* Main Content */}
      <div className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header - Pass onProfileUpdate callback */}
          <ProfileHeader
            profile={profile}
            onProfileUpdate={handleProfileUpdate}
          />

          {/* 🎯 Pending Payments Alert - Shows if there are stuck payments */}
          {userId && <PendingPaymentsAlert userId={userId} />}

          {/* 📅 Exam Reminder Banner - shows when current week has an upcoming exam */}
          <ExamReminderBanner currentWeek={profile?.current_week} />

          {/* Tabs Navigation */}
          <ProfileTabs />

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === "overview" && <OverviewTab profile={profile} />}
            {activeTab === "lecturers" && <LecturersTab />}
            {activeTab === "calendar" && <CalendarTab profile={profile} />}
            {activeTab === "scores" && <ScoresTab profile={profile} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
