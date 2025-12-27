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
  });
}

export function useWeekContent(weekNumber) {
  return useQuery({
    queryKey: ["week-content", weekNumber],
    queryFn: () => ProfileService.getWeekContent(weekNumber),
    enabled: !!weekNumber,
  });
}

export function useWeekNotes(userId, weekNumber) {
  return useQuery({
    queryKey: ["week-notes", userId, weekNumber],
    queryFn: () => ProfileService.getWeekNotes(userId, weekNumber),
    enabled: !!userId && !!weekNumber,
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
