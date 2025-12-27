// app/auth/login/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useSignIn } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Eye, EyeOff, Mail, Lock, Loader2, CheckCircle } from "lucide-react";

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
    const savedEmail = localStorage.getItem("mostore_remembered_email");
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
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0d12]">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-[#1ed760]/5 via-transparent to-[#145a32]/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <motion.h1
              className="text-4xl font-bold text-[#1ed760]"
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400 }}
            >
              LEAD
            </motion.h1>
          </Link>
          <p className="text-gray-400 mt-2">
            Welcome back! Sign in to continue
          </p>
        </div>

        {/* Success message after password reset */}
        {resetSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-[#1ed760]/10 border border-[#1ed760]/30 rounded-lg flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-[#1ed760] flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[#1ed760] font-medium">
                Password reset successful!
              </p>
              <p className="text-gray-400 text-sm mt-1">
                You can now sign in with your new password.
              </p>
            </div>
          </motion.div>
        )}

        {/* Card */}
        <motion.div
          className="bg-[#11151c] border border-gray-800 rounded-2xl p-8 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#161b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1ed760] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full pl-12 pr-12 py-3 bg-[#161b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-primary focus:border-transparent transition-all"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
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
                  className="w-4 h-4 bg-[#161b24] border border-gray-700 rounded text-[#1ed760] focus:ring-2 focus:ring-[#1ed760] focus:ring-offset-0 cursor-pointer"
                />
                <span className="text-sm text-gray-400 group-hover:text-gray-300 transition-colors">
                  Remember me
                </span>
              </label>

              <Link
                href="/auth/forgot-password"
                className="text-sm text-[#1ed760] hover:text-[#16b455] transition-colors"
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
              className="w-full py-3 bg-[#1ed760] text-black font-semibold rounded-lg hover:bg-[#16b455] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              <div className="w-full border-t border-gray-800"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-black-surface text-gray-500">
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
              className="w-full py-3 bg-transparent border border-gray-700 text-gray-300 font-semibold rounded-lg hover:bg-[#161b24] hover:border-gray-600 transition-all"
            >
              Create New Account
            </motion.button>
          </Link>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-gray-500 text-sm mt-8">
          By signing in, you agree to our{" "}
          <Link
            href="/terms"
            className="text-[#1ed760] hover:text-[#16b455] transition-colors"
          >
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-[#1ed760] hover:text-[#16b455] transition-colors"
          >
            Privacy Policy
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
