"use client";

import { motion, LayoutGroup } from "framer-motion";
import { LayoutDashboard, Users, CalendarDays } from "lucide-react";
import { useProfileStore } from "@/lib/store/profile-store";

const tabs = [
  {
    id: "overview",
    label: "Overview",
    icon: LayoutDashboard,
  },
  {
    id: "lecturers",
    label: "Lecturers",
    icon: Users,
  },
  {
    id: "calendar",
    label: "Learning Calendar",
    icon: CalendarDays,
  },
];

export default function ProfileTabs() {
  const { activeTab, setActiveTab } = useProfileStore();

  return (
    <LayoutGroup>
      <div className="relative flex gap-2 mb-8 overflow-x-auto pb-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <motion.button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap z-10"
              animate={{
                color: isActive ? "#ffffff" : "var(--text-secondary)",
              }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}

              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 -z-10"
                  style={{
                    background: "linear-gradient(135deg, #1ed760, #16b455)",
                    borderRadius: "1.5rem",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 520,
                    damping: 38,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </LayoutGroup>
  );
}
