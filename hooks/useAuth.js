// hooks/useAuth.js
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/lib/services/auth-service";
import { useRouter } from "next/navigation";

/**
 * Query: Get current student profile
 */
export function useCurrentStudent() {
  return useQuery({
    queryKey: ["student", "current"],
    queryFn: () => AuthService.getCurrentStudent(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}

/**
 * Mutation: Sign in
 */
export function useSignIn() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, password }) => AuthService.signIn(email, password),
    onSuccess: (data) => {
      // Update cache
      queryClient.setQueryData(["student", "current"], data.student);

      // Redirect to dashboard
      router.push("/profile");
    },
    onError: (error) => {
      console.error("Sign in failed:", error);
    },
  });
}

/**
 * Mutation: Sign out
 */
export function useSignOut() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: () => AuthService.signOut(),
    onSuccess: () => {
      // Clear all queries
      queryClient.clear();

      // Redirect to home
      router.push("/");
    },
  });
}

/**
 * Mutation: Request password reset
 */
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: (email) => AuthService.requestPasswordReset(email),
    onError: (error) => {
      console.error("Password reset request failed:", error);
    },
  });
}

/**
 * Mutation: Update password
 */
export function useUpdatePassword() {
  const router = useRouter();

  return useMutation({
    mutationFn: (newPassword) => AuthService.updatePassword(newPassword),
    onSuccess: () => {
      // Redirect to login after successful password reset
      router.push("/login?reset=success");
    },
    onError: (error) => {
      console.error("Password update failed:", error);
    },
  });
}

/**
 * Mutation: Resend verification email
 */
export function useResendVerification() {
  return useMutation({
    mutationFn: (email) => AuthService.resendVerificationEmail(email),
    onError: (error) => {
      console.error("Resend verification failed:", error);
    },
  });
}
