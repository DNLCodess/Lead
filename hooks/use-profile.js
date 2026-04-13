// hooks/use-profile.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/lib/services/profile-service";

export function useUserProfile(userId) {
  return useQuery({
    queryKey: ["user-profile", userId],
    queryFn: () => ProfileService.getUserProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useLecturers() {
  return useQuery({
    queryKey: ["lecturers"],
    queryFn: () => ProfileService.getLecturers(),
    staleTime: 30 * 60 * 1000,
  });
}

export function useUnlockedWeeks(userId) {
  return useQuery({
    queryKey: ["unlocked-weeks", userId],
    queryFn: () => ProfileService.getUnlockedWeeks(userId),
    enabled: !!userId,
    staleTime: 60 * 1000, // 1 min — changes after payment; short enough to pick up new unlocks
  });
}

export function useWeekContent(weekNumber) {
  return useQuery({
    queryKey: ["week-content", weekNumber],
    queryFn: () => ProfileService.getWeekContent(weekNumber),
    enabled: !!weekNumber,
    staleTime: 60 * 60 * 1000, // 1 hour — content changes rarely
  });
}

export function useWeekNotes(userId, weekNumber) {
  return useQuery({
    queryKey: ["week-notes", userId, weekNumber],
    queryFn: () => ProfileService.getWeekNotes(userId, weekNumber),
    enabled: !!userId && !!weekNumber,
    staleTime: 5 * 60 * 1000, // 5 min — user's own notes; no need to refetch on every focus
  });
}

export function useAllWeekTitles() {
  return useQuery({
    queryKey: ["all-week-titles"],
    queryFn: () => ProfileService.getAllWeekTitles(),
    staleTime: 30 * 60 * 1000, // titles rarely change
  });
}

export function useSaveWeekNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, studentId, weekNumber, notes }) =>
      ProfileService.saveWeekNotes(userId, studentId, weekNumber, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries([
        "week-notes",
        variables.userId,
        variables.weekNumber,
      ]);
    },
  });
}
