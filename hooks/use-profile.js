// hooks/use-profile.js

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ProfileService } from "@/lib/services/profile-service";
import { supabase } from "@/lib/supabase/client";

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

// ─── Exam & Scores hooks ────────────────────────────────────────────────────

// Fetch the exam date for a student's current week (for the reminder banner)
export function useCurrentWeekExam(weekNumber) {
  return useQuery({
    queryKey: ["week-exam", weekNumber],
    queryFn: async () => {
      if (!weekNumber) return null;
      const { data, error } = await supabase
        .from("week_content")
        .select("week_number, exam_date, exam_description, exam_link")
        .eq("week_number", weekNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!weekNumber,
    staleTime: 5 * 60 * 1000,
  });
}

// Fetch all scores for the current student
export function useMyScores(userId) {
  return useQuery({
    queryKey: ["my-scores", userId],
    queryFn: async () => {
      if (!userId) return [];
      const { data, error } = await supabase
        .from("week_scores")
        .select(
          "week_number, score, grade, grade_point, remarks, updated_at",
        )
        .eq("user_id", userId)
        .order("week_number", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}
