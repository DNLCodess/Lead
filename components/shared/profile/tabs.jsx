// "use client";

// import { motion, LayoutGroup } from "framer-motion";
// import { LayoutDashboard, Users, CalendarDays } from "lucide-react";
// import { useProfileStore } from "@/lib/store/profile-store";

// const tabs = [
//   {
//     id: "overview",
//     label: "Overview",
//     icon: LayoutDashboard,
//   },
//   {
//     id: "lecturers",
//     label: "Lecturers",
//     icon: Users,
//   },
//   {
//     id: "calendar",
//     label: "Learning Calendar",
//     icon: CalendarDays,
//   },
// ];

// export default function ProfileTabs() {
//   const { activeTab, setActiveTab } = useProfileStore();

//   return (
//     <LayoutGroup>
//       <div className="relative flex gap-2 mb-8 overflow-x-auto pb-2">
//         {tabs.map((tab) => {
//           const isActive = activeTab === tab.id;
//           const Icon = tab.icon;

//           return (
//             <motion.button
//               key={tab.id}
//               onClick={() => setActiveTab(tab.id)}
//               className="relative flex items-center gap-2 px-6 py-3 font-semibold whitespace-nowrap z-10"
//               animate={{
//                 color: isActive ? "#ffffff" : "var(--text-secondary)",
//               }}
//               transition={{ duration: 0.25, ease: "easeOut" }}
//             >
//               <Icon className="w-4 h-4" />
//               {tab.label}

//               {isActive && (
//                 <motion.div
//                   layoutId="activeTab"
//                   className="absolute inset-0 -z-10"
//                   style={{
//                     background: "linear-gradient(135deg, #1ed760, #16b455)",
//                     borderRadius: "1.5rem",
//                   }}
//                   transition={{
//                     type: "spring",
//                     stiffness: 520,
//                     damping: 38,
//                   }}
//                 />
//               )}
//             </motion.button>
//           );
//         })}
//       </div>
//     </LayoutGroup>
//   );
// }

// components/shared/profile/tabs.jsx

"use client";

import { motion } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";
import { useRouter } from "next/navigation";
import { Calendar, LayoutDashboard, Users } from "lucide-react";

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
    <div className="mb-8">
      <div
        className="flex items-center gap-2 p-1.5 rounded-xl backdrop-blur-sm"
        style={{
          background: "var(--color-black-surface)",
          border: "1px solid var(--color-black-border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="relative flex-1 px-6 py-3.5 rounded-lg font-semibold text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              style={{
                color: isActive
                  ? "var(--text-primary)"
                  : "var(--text-secondary)",
                fontFamily: "var(--font-satoshi)",
              }}
            >
              {/* Active background with animated border */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 rounded-lg"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1.5px solid var(--color-green-primary)",
                    boxShadow: "0 0 20px rgba(30, 215, 96, 0.2)",
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 30,
                  }}
                />
              )}

              {/* Hover effect for inactive tabs */}
              {!isActive && (
                <div
                  className="absolute inset-0 rounded-lg opacity-0 hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background: "var(--color-black-border)",
                  }}
                />
              )}

              {/* Tab content */}
              <span className="relative z-10 flex items-center justify-center gap-2.5">
                <Icon
                  className="w-5 h-5 transition-colors duration-200"
                  style={{
                    color: isActive
                      ? "var(--color-green-primary)"
                      : "var(--text-muted)",
                  }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </span>

              {/* Active indicator dot (mobile) */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-2 h-2 rounded-full sm:hidden"
                  style={{
                    background: "var(--color-green-primary)",
                    boxShadow: "0 0 10px rgba(30, 215, 96, 0.5)",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Active tab indicator line (optional decorative element) */}
      <motion.div
        className="mt-1 h-0.5 rounded-full"
        style={{
          background:
            "linear-gradient(90deg, var(--color-green-primary), var(--color-green-soft))",
        }}
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "100%", opacity: 0.3 }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}
