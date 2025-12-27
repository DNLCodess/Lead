// app/profile/page.jsx (ADD THIS)

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase/client";
import { useUserProfile } from "@/hooks/use-profile";
import { useProfileStore } from "@/lib/store/profile-store";
import { useQueryClient } from "@tanstack/react-query";
import LecturersTab from "@/components/shared/profile/tab/lecturers";
import OverviewTab from "@/components/shared/profile/tab/overview";
import CalendarTab from "@/components/shared/profile/tab/calendar";
import ProfileTabs from "@/components/shared/profile/tabs";
import ProfileHeader from "@/components/shared/profile/header";

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [userId, setUserId] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { activeTab } = useProfileStore();

  const { data: profile, isLoading: profileLoading } = useUserProfile(userId);

  // Check authentication
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        setUserId(session.user.id);
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  // Handle profile update from edit modal
  const handleProfileUpdate = (updatedProfile) => {
    // Invalidate and refetch profile query
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
