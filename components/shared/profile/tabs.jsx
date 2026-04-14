"use client";

import { motion } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";
import { useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, Users, GraduationCap } from "lucide-react";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "calendar",
    label: "Calendar",
    icon: Calendar,
  },
  {
    id: "lecturers",
    label: "Lecturers",
    icon: Users,
  },
  {
    id: "scores",
    label: "Scores",
    icon: GraduationCap,
  },
];

export default function ProfileTabs() {
  const router = useRouter();
  const { activeTab, setActiveTab } = useProfileStore();

  const handleTabChange = (tabId) => {
    // Update store first
    setActiveTab(tabId);

    // Update URL without adding to history
    router.replace(`/profile?tab=${tabId}`, { scroll: false });
  };

  return (
    <div className="mb-8 pt-6">
      {/* Tab container — outer radius 1rem, gap 6px, so inner should be ~10px */}
      <div
        className="flex items-center gap-1.5 p-1.5"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border-color)",
          borderRadius: "var(--radius-card)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="relative flex-1 px-6 py-3.5 font-semibold text-sm transition-colors duration-200 active:scale-[0.98]"
              style={{
                color: isActive ? "var(--text-primary)" : "var(--text-secondary)",
                fontFamily: "var(--font-satoshi)",
                /* 10px = 16px outer − 6px gap: correct nested radius */
                borderRadius: "10px",
              }}
            >
              {/* Active pill — elevation only, no border */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0"
                  style={{
                    borderRadius: "10px",
                    background: "var(--elevated)",
                    boxShadow:
                      "inset 0 1px 0 rgba(255,255,255,0.07), 0 0 0 1px rgba(30,215,96,0.18), 0 4px 12px rgba(30,215,96,0.08)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}

              {/* Hover state */}
              {!isActive && (
                <div
                  className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-150"
                  style={{ borderRadius: "10px", background: "var(--elevated)" }}
                />
              )}

              {/* Content */}
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <Icon
                  className="w-4 h-4 transition-colors duration-200"
                  style={{
                    color: isActive ? "var(--color-green-primary)" : "var(--text-muted)",
                  }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>

              {/* Green underline on active — replaces the border box */}
              {isActive && (
                <motion.div
                  layoutId="activeTabLine"
                  className="absolute bottom-1.5 left-1/2 -translate-x-1/2 h-0.5 rounded-full"
                  style={{
                    width: "32px",
                    background: "var(--color-green-primary)",
                    boxShadow: "0 0 8px rgba(30,215,96,0.6)",
                  }}
                  transition={{ type: "spring", stiffness: 500, damping: 35 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
