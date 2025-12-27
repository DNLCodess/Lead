// components/shared/profile/header.jsx (UPDATE EXISTING FILE)

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import ProfileMenu from "./menu";

export default function ProfileHeader({ profile }) {
  const isNigerian = profile?.account_type === "nigerian";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative  p-8 mb-8"
      style={{
        background:
          "linear-gradient(135deg, var(--color-black-surface) 0%, var(--color-black-elevated) 100%)",
        borderRadius: "1.5rem",
        border: "1px solid var(--color-black-border)",
      }}
    >
      {/* Background Glow */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(30, 215, 96, 0.3), transparent 60%)",
        }}
      />

      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Profile Picture */}
        <div className="relative">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-[#1ed760]/20">
            {profile?.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-4xl font-bold"
                style={{
                  background: "linear-gradient(135deg, #1ed760, #16b455)",
                  color: "var(--color-black-base)",
                }}
              >
                {profile?.first_name?.[0]}
                {profile?.last_name?.[0]}
              </div>
            )}
          </div>
          {/* Online Indicator */}
          <div className="absolute bottom-2 right-2 w-4 h-4 bg-[#1ed760] rounded-full border-2 border-[var(--color-black-surface)]" />
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1
            className="text-3xl md:text-4xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            {profile?.first_name} {profile?.last_name}
          </h1>
          <p
            className="text-lg mb-3"
            style={{ color: "var(--text-secondary)" }}
          >
            {profile?.email}
          </p>

          {/* Account Badge */}
          <div className="flex items-center gap-3">
            <div
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold"
              style={{
                background: isNigerian
                  ? "linear-gradient(135deg, #1ed760, #16b455)"
                  : "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "#ffffff",
                borderRadius: "9999px",
              }}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {isNigerian ? "Nigerian Account" : "International Account"}
            </div>

            <div
              className="px-4 py-2 text-sm font-medium"
              style={{
                background: "var(--color-black-border)",
                color: "var(--text-secondary)",
                borderRadius: "9999px",
              }}
            >
              📍 {profile?.city}, {profile?.country}
            </div>
          </div>
        </div>

        {/* Profile Menu (replaces Stats) */}
        <ProfileMenu profile={profile} />
        {/* <div className="grid grid-cols-2 gap-4 md:gap-6">
          <div className="text-center">
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: "#1ed760" }}
            >
              {profile?.stats?.unlockedWeeks || 0}
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Weeks Unlocked
            </div>
          </div>
          <div className="text-center">
            <div
              className="text-3xl font-bold mb-1"
              style={{ color: "#1ed760" }}
            >
              {Math.round(profile?.stats?.progress || 0)}%
            </div>
            <div className="text-sm" style={{ color: "var(--text-secondary)" }}>
              Progress
            </div>
          </div>
        </div> */}
      </div>
    </motion.div>
  );
}
