"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { MapPin, Flame } from "lucide-react";
import ProfileMenu from "./menu";

export default function ProfileHeader({ profile }) {
  const isNigerian = profile?.account_type === "nigerian";
  const currentWeek = profile?.current_week || 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="relative pt-6 pb-8 mb-2"
      style={{ zIndex: 20 }}
    >
      {/* Ambient glow — scoped inside a non-clipping overlay so dropdown escapes */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at top right, rgba(30, 215, 96, 0.1), transparent 60%)",
        }}
      />

      {/* Mobile: Menu at top right */}
      <div className="flex items-start justify-between mb-5 md:hidden relative z-10">
        <div className="flex-1" />
        <ProfileMenu profile={profile} />
      </div>

      {/* Main row */}
      <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-5 md:gap-8">
        {/* Avatar */}
        <div className="mx-auto md:mx-0 shrink-0">
          <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full overflow-hidden ring-4 ring-[#1ed760]/20">
            {profile?.profile_picture_url ? (
              <Image
                src={profile.profile_picture_url}
                alt={`${profile.first_name} ${profile.last_name}`}
                width={112}
                height={112}
                className="w-full h-full object-cover"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center text-2xl sm:text-3xl md:text-4xl font-bold"
                style={{
                  background: "#1ed760",
                  color: "var(--color-black-base)",
                }}
              >
                {profile?.first_name?.[0]}
                {profile?.last_name?.[0]}
              </div>
            )}
          </div>
        </div>

        {/* Name + meta */}
        <div className="flex-1 text-center md:text-left w-full min-w-0">
          <h1
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-1 leading-tight"
            style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
          >
            {profile?.first_name} {profile?.last_name}
          </h1>
          <p
            className="text-sm mb-4"
            style={{ color: "var(--text-muted)" }}
          >
            {profile?.email}
          </p>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold"
              style={{
                background: "rgba(30, 215, 96, 0.15)",
                color: "#1ed760",
                borderRadius: "9999px",
                border: "1px solid rgba(30, 215, 96, 0.3)",
              }}
            >
              <Flame className="w-3 h-3" />
              Week {currentWeek}
            </div>

            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium"
              style={{
                background: "var(--elevated)",
                color: "var(--text-secondary)",
                borderRadius: "9999px",
                border: "1px solid var(--border-color)",
              }}
            >
              <MapPin className="w-3 h-3" />
              {profile?.city}, {profile?.country}
            </div>

            <div
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium"
              style={{
                background: isNigerian ? "rgba(30,215,96,0.08)" : "rgba(59,130,246,0.08)",
                color: isNigerian ? "var(--text-secondary)" : "var(--text-secondary)",
                borderRadius: "9999px",
                border: isNigerian
                  ? "1px solid rgba(30,215,96,0.15)"
                  : "1px solid rgba(59,130,246,0.15)",
              }}
            >
              {isNigerian ? "Nigerian" : "International"}
            </div>
          </div>
        </div>

        {/* Desktop: Menu — unrestricted z-context, no overflow parent */}
        <div className="hidden md:block shrink-0">
          <ProfileMenu profile={profile} />
        </div>
      </div>

      {/* Separator line — replaces card border as visual division */}
      <div
        className="absolute bottom-0 inset-x-0 h-px"
        style={{
          background: "linear-gradient(90deg, rgba(30,215,96,0.3), var(--border-color) 40%, transparent)",
        }}
      />
    </motion.div>
  );
}
