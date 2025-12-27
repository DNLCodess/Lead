// app/profile/components/tabs/CalendarTab.jsx

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useProfileStore } from "@/lib/store/profile-store";
import { useUnlockedWeeks } from "@/hooks/use-profile";
import PaymentWidget from "../calendar/payment-widget";
import ProgressBar from "../calendar/progress-bar";
import WeekCard from "../calendar/week-card";
import WeekDetailModal from "../calendar/week-detail";

export default function CalendarTab({ profile }) {
  const { data: unlockedWeeks = [], isLoading } = useUnlockedWeeks(
    profile?.user_id
  );
  const { selectedWeek, showWeekModal } = useProfileStore();

  const currentWeek = profile?.current_week || 1;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div
          className="h-32 rounded-xl animate-pulse"
          style={{
            background: "var(--color-black-surface)",
            borderRadius: "1.2rem",
          }}
        />
        <div
          className="h-96 rounded-xl animate-pulse"
          style={{
            background: "var(--color-black-surface)",
            borderRadius: "1.2rem",
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress Overview */}
      <ProgressBar
        unlockedWeeks={unlockedWeeks.length}
        totalWeeks={52}
        currentWeek={currentWeek}
      />

      {/* Payment Widget */}
      <PaymentWidget profile={profile} />

      {/* Calendar Grid */}
      <div>
        <h2
          className="text-2xl font-bold mb-6"
          style={{
            fontFamily: "var(--font-satoshi)",
            color: "var(--text-primary)",
          }}
        >
          52-Week Learning Journey
        </h2>

        <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-10 lg:grid-cols-13 gap-3">
          {Array.from({ length: 52 }, (_, i) => i + 1).map((weekNumber) => {
            const isUnlocked = unlockedWeeks.includes(weekNumber);
            const isCurrent = weekNumber === currentWeek;
            const isUpcoming = weekNumber === currentWeek + 1;

            return (
              <WeekCard
                key={weekNumber}
                weekNumber={weekNumber}
                isUnlocked={isUnlocked}
                isCurrent={isCurrent}
                isUpcoming={isUpcoming}
              />
            );
          })}
        </div>
      </div>

      {/* Week Detail Modal */}
      <AnimatePresence>
        {showWeekModal && selectedWeek && (
          <WeekDetailModal
            weekNumber={selectedWeek}
            profile={profile}
            isUnlocked={unlockedWeeks.includes(selectedWeek)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
