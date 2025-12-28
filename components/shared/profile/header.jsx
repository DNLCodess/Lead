"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, CheckCircle2 } from "lucide-react";
import ProfileMenu from "./menu";

export default function ProfileHeader({ profile }) {
  const isNigerian = profile?.account_type === "nigerian";

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-4 sm:p-6 md:p-8 mb-8"
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
          borderRadius: "1.5rem",
        }}
      />

      <div className="relative z-10">
        {/* Mobile Layout: Profile Menu at Top Right */}
        <div className="flex items-start justify-between mb-4 md:hidden">
          <div className="flex-1" />
          <ProfileMenu profile={profile} />
        </div>

        {/* Main Content */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6">
          {/* Profile Picture */}
          <div className="relative mx-auto md:mx-0">
            <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-full overflow-hidden ring-4 ring-[#1ed760]/20">
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
                  className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
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
            <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 w-3 h-3 md:w-4 md:h-4 bg-[#1ed760] rounded-full border-2 border-[var(--color-black-surface)]" />
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left w-full">
            <h1
              className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-satoshi)",
                color: "var(--text-primary)",
              }}
            >
              {profile?.first_name} {profile?.last_name}
            </h1>
            <p
              className="text-sm sm:text-base md:text-lg mb-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {profile?.email}
            </p>

            {/* Account Badges - Stack on Mobile */}
            <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-2 sm:gap-3">
              <div
                className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold"
                style={{
                  background: isNigerian
                    ? "linear-gradient(135deg, #1ed760, #16b455)"
                    : "linear-gradient(135deg, #3b82f6, #2563eb)",
                  color: "#ffffff",
                  borderRadius: "9999px",
                }}
              >
                <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4" />
                {isNigerian ? "Nigerian Account" : "International Account"}
              </div>

              <div
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium"
                style={{
                  background: "var(--color-black-border)",
                  color: "var(--text-secondary)",
                  borderRadius: "9999px",
                }}
              >
                <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                {profile?.city}, {profile?.country}
              </div>
            </div>
          </div>

          {/* Profile Menu - Desktop Only */}
          <div className="hidden md:block">
            <ProfileMenu profile={profile} />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
