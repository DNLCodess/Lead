// app/forgot-password/page.jsx
"use client";

import { useState } from "react";
import { useRequestPasswordReset } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import Link from "next/link";
import { Mail, Loader2, CheckCircle, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [emailSent, setEmailSent] = useState(false);

  const resetMutation = useRequestPasswordReset();

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await resetMutation.mutateAsync(email);
      setEmailSent(true);
    } catch (error) {
      console.error("Password reset request failed:", error);
    }
  };

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0d12]">
        <div className="fixed inset-0 bg-gradient-to-br from-[#1ed760]/5 via-transparent to-[#145a32]/5 pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-[#11151c] border border-gray-800 rounded-2xl p-8 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2 }}
              className="inline-flex items-center justify-center w-16 h-16 bg-[#1ed760]/10 rounded-full mb-6"
            >
              <CheckCircle className="w-8 h-8 text-[#1ed760]" />
            </motion.div>

            <h2 className="text-2xl font-bold text-white mb-3">
              Check Your Email
            </h2>

            <p className="text-gray-400 mb-2">
              We&lsquo;ve sent a password reset link to:
            </p>

            <p className="text-[#1ed760] font-medium mb-6">{email}</p>

            <p className="text-gray-400 text-sm mb-8">
              Click the link in the email to reset your password. The link will
              expire in 24 hours.
            </p>

            <div className="space-y-3">
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 bg-[#1ed760] text-black font-semibold rounded-lg hover:bg-[#16b455] transition-colors"
                >
                  Back to Sign In
                </motion.button>
              </Link>

              <button
                onClick={() => setEmailSent(false)}
                className="w-full py-3 text-gray-400 hover:text-gray-300 transition-colors text-sm"
              >
                Didn&lsquo;t receive the email? Try again
              </button>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-6">
            Check your spam folder if you don&lsquo;t see the email within a few
            minutes.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[#0a0d12]">
      <div className="fixed inset-0 bg-gradient-to-br from-[#1ed760]/5 via-transparent to-[#145a32]/5 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Back button */}
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-300 transition-colors mb-8 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Sign In
        </Link>

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
          <h2 className="text-2xl font-bold text-white mt-4">
            Reset Your Password
          </h2>
          <p className="text-gray-400 mt-2">
            Enter your email and we'll send you a reset link
          </p>
        </div>

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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-12 pr-4 py-3 bg-[#161b24] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1ed760] focus:border-transparent transition-all"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Error message */}
            {resetMutation.isError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg"
              >
                <p className="text-red-400 text-sm">
                  {resetMutation.error.message}
                </p>
              </motion.div>
            )}

            {/* Submit button */}
            <motion.button
              type="submit"
              disabled={resetMutation.isPending}
              whileHover={{ scale: resetMutation.isPending ? 1 : 1.02 }}
              whileTap={{ scale: resetMutation.isPending ? 1 : 0.98 }}
              className="w-full py-3 bg-[#1ed760] text-black font-semibold rounded-lg hover:bg-[#16b455] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {resetMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Reset Link"
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Help text */}
        <div className="mt-6 text-center">
          <p className="text-gray-500 text-sm">
            Remember your password?{" "}
            <Link
              href="/login"
              className="text-[#1ed760] hover:text-[#16b455] transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
