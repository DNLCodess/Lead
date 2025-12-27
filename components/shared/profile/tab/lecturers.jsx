// app/profile/components/tabs/LecturersTab.jsx

"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useLecturers } from "@/hooks/use-profile";

export default function LecturersTab() {
  const { data: lecturers, isLoading } = useLecturers();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-96 rounded-xl animate-pulse"
            style={{ background: "var(--color-black-surface)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lecturers?.map((lecturer, index) => (
        <motion.div
          key={lecturer.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="group relative overflow-hidden rounded-xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            borderRadius: "1.2rem",
          }}
        >
          {/* Image */}
          {/* Image */}
          <div className="relative h-72 overflow-hidden">
            <Image
              src={lecturer.image_url}
              alt={lecturer.name}
              fill
              priority={index < 3}
              className="
      object-cover
      object-top
      transition-transform
      duration-500
      group-hover:scale-105
    "
            />
            <div className="absolute inset-0 bg-linear-to-t from-color-black-base via-transparent to-transparent" />
          </div>

          {/* Content */}
          <div className="p-6">
            <h3
              className="text-2xl font-bold mb-2"
              style={{
                fontFamily: "var(--font-satoshi)",
                color: "var(--text-primary)",
              }}
            >
              {lecturer.name}
            </h3>
            <p
              className="text-sm mb-4 line-clamp-3"
              style={{ color: "var(--text-secondary)" }}
            >
              {lecturer.bio}
            </p>

            {/* Expertise Tags */}
            <div className="flex flex-wrap gap-2">
              {lecturer.expertise?.map((skill, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-full text-xs font-medium"
                  style={{
                    background: "var(--color-black-border)",
                    color: "#1ed760",
                  }}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Hover Effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1ed760]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
      ))}
    </div>
  );
}
