// app/auth/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useSignIn } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle } from "lucide-react";
import Image from "next/image";

export default function LoginPage() {
  const searchParams = useSearchParams();
  const resetSuccess = searchParams.get("reset") === "success";

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const signInMutation = useSignIn();

  // Load saved email if "Remember Me" was checked
  useEffect(() => {
    const savedEmail = localStorage.getItem("lead_remembered_email");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Save email if "Remember Me" is checked
    if (rememberMe) {
      localStorage.setItem("lead_remembered_email", formData.email);
    } else {
      localStorage.removeItem("lead_remembered_email");
    }

    await signInMutation.mutateAsync(formData);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-(--color-black-base)">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-linear-to-br from-green-primary/5 via-transparent to-green-primary/3 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <motion.div
              whileHover={{ rotate: 5, scale: 1.05 }}
              className="relative w-32 h-32 mx-auto"
            >
              <Image
                src="/logo-dark.png"
                alt="Logo"
                fill
                className="object-contain "
                priority
              />
            </motion.div>
          </Link>
          <p className="mt-2 text-(--text-secondary)">
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Success message after password reset */}
        {resetSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-primary/10 border border-green-primary/30 rounded-xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-green-primary font-medium">
                Password reset successful!
              </p>
              <p className="text-(--text-secondary) text-sm mt-1">
                You can now sign in with your new password.
              </p>
            </div>
          </motion.div>
        )}

        {/* Card */}
        <motion.div
          className="card p-8"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-(--text-primary) mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted)" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 rounded-xl outline-none border border-(--color-black-border) bg-(--color-black-elevated) text-(--text-primary) placeholder:text-(--text-muted) focus:border-green-primary focus:ring-2 focus:ring-green-primary/20 transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-(--text-primary) mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-(--text-muted)" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3 rounded-xl outline-none border border-(--color-black-border) bg-(--color-black-elevated) text-(--text-primary) placeholder:text-(--text-muted) focus:border-green-primary focus:ring-2 focus:ring-green-primary/20 transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 bg-(--color-black-elevated) border border-(--color-black-border) rounded text-green-primary focus:ring-2 focus:ring-green-primary/20 focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-green-primary hover:text-green-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Error message */}
            {signInMutation.isError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">
                  {signInMutation.error.message}
                </p>
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={signInMutation.isPending}
              whileHover={{ scale: signInMutation.isPending ? 1 : 1.02 }}
              whileTap={{ scale: signInMutation.isPending ? 1 : 0.98 }}
              className="w-full py-3 bg-green-primary text-black font-semibold rounded-xl hover:bg-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {signInMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </motion.button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-(--color-black-border)"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-(--color-black-surface) text-(--text-muted)">
                Don&lsquo;t have an account?
              </span>
            </div>
          </div>

          {/* Sign up link */}
          <Link href="/auth/register">
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 bg-transparent border border-(--color-black-border) text-(--text-secondary) font-semibold rounded-xl hover:bg-(--color-black-elevated) hover:text-(--text-primary) transition-all"
            >
              Create New Account
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-(--text-muted) text-sm mt-8">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="text-green-primary hover:text-green-hover transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-green-primary hover:text-green-hover transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
