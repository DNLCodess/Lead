// app/lead-admin/login/page.jsx

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import { Shield, Lock, Mail, Eye, EyeOff } from "lucide-react";
import Image from "next/image";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoggingIn, loginError } = useAdminAuth();

  const handleSubmit = (e) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: "var(--gradient-black-ambient)",
      }}
    >
      {/* Ambient Glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: "var(--gradient-green-glow)",
          opacity: 0.3,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        {/* Logo/Header */}
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-8"
        >
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
          <h1
            className="text-4xl font-bold mb-2"
            style={{
              fontFamily: "var(--font-satoshi)",
              color: "var(--text-primary)",
            }}
          >
            LEAD Admin
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Secure access for administrators
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-2xl"
          style={{
            background: "var(--color-black-surface)",
            border: "1px solid var(--color-black-border)",
            boxShadow: "var(--shadow-xl)",
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Email Address
              </label>
              <div className="relative">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@leadprogram.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl outline-none transition-all"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border =
                      "1px solid var(--color-green-primary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border =
                      "1px solid var(--color-black-border)";
                  }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold mb-2"
                style={{ color: "var(--text-primary)" }}
              >
                Password
              </label>
              <div className="relative">
                <div
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl outline-none transition-all"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    color: "var(--text-primary)",
                  }}
                  onFocus={(e) => {
                    e.target.style.border =
                      "1px solid var(--color-green-primary)";
                  }}
                  onBlur={(e) => {
                    e.target.style.border =
                      "1px solid var(--color-black-border)";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--text-muted)" }}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {loginError && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl flex items-start gap-3"
                style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid rgba(239, 68, 68, 0.3)",
                }}
              >
                <div className="text-red-500 mt-0.5">⚠</div>
                <div>
                  <p className="text-sm font-semibold text-red-500 mb-1">
                    Authentication Failed
                  </p>
                  <p className="text-sm text-red-400">
                    {loginError.message ||
                      "Invalid credentials or insufficient permissions"}
                  </p>
                </div>
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isLoggingIn}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #1ed760, #16b455)",
                color: "#ffffff",
              }}
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Authenticating...
                </span>
              ) : (
                "Sign In to Dashboard"
              )}
            </motion.button>
          </form>

          {/* Security Notice */}
          <div
            className="mt-6 pt-6 border-t"
            style={{ borderColor: "var(--color-black-border)" }}
          >
            <p
              className="text-xs text-center"
              style={{ color: "var(--text-muted)" }}
            >
              🔒 This is a secure administrator area. All activity is logged and
              monitored.
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <p
          className="text-center mt-6 text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          LEAD Program © 2025 • Leadership Earned After Discipleship
        </p>
      </motion.div>
    </div>
  );
}
