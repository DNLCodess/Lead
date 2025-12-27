// store/profile-store.js

import { create } from "zustand";

export const useProfileStore = create((set) => ({
  activeTab: "overview",
  selectedWeek: null,
  showWeekModal: false,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setSelectedWeek: (week) => set({ selectedWeek: week, showWeekModal: true }),
  closeWeekModal: () => set({ showWeekModal: false, selectedWeek: null }),
}));
