// hooks/use-admin-auth.js

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function useAdminAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const supabase = createClient();

  // Check if current user is admin - with longer stale time for performance
  const { data: adminData, isLoading } = useQuery({
    queryKey: ["admin-auth"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        throw new Error("Not authenticated");
      }

      // Check if user is a lecturer with admin privileges
      const { data: lecturer, error } = await supabase
        .from("lecturers")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (error || !lecturer) {
        throw new Error("Not authorized as admin");
      }

      if (!["admin", "super_admin"].includes(lecturer.role)) {
        throw new Error("Insufficient permissions");
      }

      return {
        user: session.user,
        lecturer,
        permissions: {
          canManageContent: lecturer.can_manage_content,
          canManageUsers: lecturer.can_manage_users,
          canViewAnalytics: lecturer.can_view_analytics,
          isSuperAdmin: lecturer.role === "super_admin",
        },
      };
    },
    retry: false,
    staleTime: 10 * 60 * 1000, // 10 minutes - prevents constant re-checking
    gcTime: 15 * 60 * 1000, // 15 minutes - cache time
    refetchOnWindowFocus: false, // Don't refetch on window focus
    refetchOnMount: false, // Don't refetch on component mount if data exists
  });

  // Admin login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Verify admin status
      const { data: lecturer } = await supabase
        .from("lecturers")
        .select("*")
        .eq("user_id", data.user.id)
        .single();

      if (!lecturer || !["admin", "super_admin"].includes(lecturer.role)) {
        await supabase.auth.signOut();
        throw new Error("Not authorized as admin");
      }

      // Create admin session log
      await supabase.from("admin_sessions").insert({
        lecturer_id: lecturer.id,
        user_id: data.user.id,
        is_active: true,
      });

      return { user: data.user, lecturer };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-auth"] });
      router.push("/admin/dashboard");
    },
  });

  // Admin logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      if (adminData?.lecturer) {
        // Update session log
        await supabase
          .from("admin_sessions")
          .update({
            is_active: false,
            logged_out_at: new Date().toISOString(),
          })
          .eq("lecturer_id", adminData.lecturer.id)
          .eq("is_active", true);
      }

      await supabase.auth.signOut();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push("/lead-admin/login");
    },
  });

  return {
    adminData,
    isLoading,
    isAdmin: !!adminData,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
  };
}
