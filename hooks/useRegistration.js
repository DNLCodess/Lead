import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AuthService } from "@/lib/services/auth-service";
import { useRouter } from "next/navigation";

/**
 * Hook for user registration
 */
export function useRegistration() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (registrationData) =>
      AuthService.registerStudent(registrationData),
    onSuccess: (data) => {
      // Clear any cached auth data
      queryClient.invalidateQueries({ queryKey: ["auth"] });

      // Redirect to verification page or dashboard
      router.push("/verify-email");
    },
    onError: (error) => {
      console.error("Registration failed:", error);
    },
  });
}

/**
 * Hook for user sign in
 */
export function useSignIn() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }) => AuthService.signIn(email, password),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["student"] });
      router.push("/dashboard");
    },
    onError: (error) => {
      console.error("Sign in failed:", error);
    },
  });
}

/**
 * Hook for user sign out
 */
export function useSignOut() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => AuthService.signOut(),
    onSuccess: () => {
      queryClient.clear();
      router.push("/login");
    },
  });
}

/**
 * Hook to get current student profile
 */
export function useStudent() {
  return useQuery({
    queryKey: ["student"],
    queryFn: () => AuthService.getCurrentStudent(),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update student profile
 */
export function useUpdateStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates) => AuthService.updateStudent(updates),
    onSuccess: (data) => {
      queryClient.setQueryData(["student"], data);
      queryClient.invalidateQueries({ queryKey: ["student"] });
    },
  });
}
