"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { GraduationCap } from "lucide-react";
import { useLecturers } from "@/hooks/use-profile";

const ACCENTS = [
  { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", dimBg: "rgba(59,130,246,0.06)", gradient: "linear-gradient(160deg, #0d1a2e 0%, #111827 100%)" },
  { color: "#8b5cf6", bg: "rgba(139,92,246,0.12)", dimBg: "rgba(139,92,246,0.06)", gradient: "linear-gradient(160deg, #130d2e 0%, #111827 100%)" },
  { color: "#f59e0b", bg: "rgba(245,158,11,0.12)", dimBg: "rgba(245,158,11,0.06)", gradient: "linear-gradient(160deg, #1e180d 0%, #111827 100%)" },
  { color: "#1ed760", bg: "rgba(30,215,96,0.12)", dimBg: "rgba(30,215,96,0.06)", gradient: "linear-gradient(160deg, #0d1f12 0%, #111827 100%)" },
  { color: "#ef4444", bg: "rgba(239,68,68,0.12)", dimBg: "rgba(239,68,68,0.06)", gradient: "linear-gradient(160deg, #1f0d0d 0%, #111827 100%)" },
];

function transformSupabaseImageUrl(url, width) {
  if (!url?.includes("/storage/v1/object/public/")) return url;
  const transformed = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );
  return `${transformed}?width=${width}&quality=80`;
}

function LecturerPhoto({ name, imageUrl, color, bg, gradient }) {
  const [err, setErr] = useState(false);
  const initials = name
    ?.split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

  return (
    <div className="relative h-64 overflow-hidden" style={{ background: gradient }}>
      {imageUrl && !err ? (
        <Image
          src={transformSupabaseImageUrl(imageUrl, 600)}
          alt={name}
          fill
          className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
          onError={() => setErr(true)}
          unoptimized
        />
      ) : (
        /* Fallback — intentional gradient + oversized initials, not a broken void */
        <div
          className="absolute inset-0 flex items-center justify-center select-none"
          style={{ background: bg }}
        >
          <span
            className="font-bold leading-none"
            style={{ fontSize: "7rem", color, opacity: 0.18 }}
          >
            {initials}
          </span>
        </div>
      )}

      {/* Bottom scrim — name reads cleanly over any image */}
      <div
        className="absolute inset-x-0 bottom-0 h-36 pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(8,12,18,0.96) 0%, rgba(8,12,18,0.6) 55%, transparent 100%)",
        }}
      />
    </div>
  );
}

export default function LecturersTab() {
  const { data: lecturers, isLoading } = useLecturers();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: "var(--color-black-surface)" }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-2xl overflow-hidden animate-pulse" style={{ background: "var(--color-black-surface)" }}>
              <div className="h-64" style={{ background: "var(--color-black-elevated)" }} />
              <div className="p-5 space-y-3">
                <div className="h-4 w-32 rounded" style={{ background: "var(--color-black-elevated)" }} />
                <div className="h-3 w-full rounded" style={{ background: "var(--color-black-elevated)" }} />
                <div className="h-3 w-4/5 rounded" style={{ background: "var(--color-black-elevated)" }} />
                <div className="flex gap-2 pt-1">
                  {[1, 2].map((j) => (
                    <div key={j} className="h-5 w-16 rounded-full" style={{ background: "var(--color-black-elevated)" }} />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!lecturers?.length) {
    return (
      <div className="card p-12 text-center">
        <GraduationCap className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
        <p className="font-semibold mb-1" style={{ color: "var(--text-primary)" }}>No lecturers yet</p>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>Lecturer profiles will appear here once added.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2
          className="text-xl font-bold mb-1"
          style={{ fontFamily: "var(--font-satoshi)", color: "var(--text-primary)" }}
        >
          Meet Your Lecturers
        </h2>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          Industry practitioners guiding your 52-week journey
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {lecturers.map((lecturer, index) => {
          const accent = ACCENTS[index % ACCENTS.length];

          return (
            <motion.div
              key={lecturer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="card group flex flex-col overflow-hidden"
              style={{ borderColor: `${accent.color}18` }}
            >
              {/* Photo — always fills h-64, never a void */}
              <LecturerPhoto
                name={lecturer.name}
                imageUrl={lecturer.image_url}
                color={accent.color}
                bg={accent.bg}
                gradient={accent.gradient}
              />

              {/* Name overlaid at bottom of photo */}
              <div
                className="px-5 -mt-14 relative z-10 pb-1"
              >
                <h3
                  className="text-xl font-bold leading-tight"
                  style={{ fontFamily: "var(--font-satoshi)", color: "#fff" }}
                >
                  {lecturer.name}
                </h3>
                {/* Accent rule under name */}
                <div
                  className="mt-1.5 h-0.5 w-8 rounded-full"
                  style={{ background: accent.color }}
                />
              </div>

              {/* Content */}
              <div className="px-5 pt-3 pb-5 flex flex-col flex-1 gap-3">
                {/* Bio */}
                {lecturer.bio && (
                  <p
                    className="text-sm flex-1"
                    style={{ color: "var(--text-secondary)", lineHeight: "1.7" }}
                  >
                    {lecturer.bio}
                  </p>
                )}

                {/* Expertise tags */}
                {lecturer.expertise?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {lecturer.expertise.map((skill, idx) => {
                      const tagAccent = ACCENTS[(index + idx) % ACCENTS.length];
                      return (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-full text-[10px] font-semibold"
                          style={{
                            background: tagAccent.dimBg,
                            color: tagAccent.color,
                            border: `1px solid ${tagAccent.color}20`,
                          }}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
