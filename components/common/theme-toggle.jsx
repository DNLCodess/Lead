"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";

const FloatingThemeToggleExpanded = ({ position = "bottom-right" }) => {
  const { theme, toggleTheme } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const isDark = theme === "dark";

  // Position classes
  const positionClasses = {
    "bottom-right": "bottom-8 right-8",
    "bottom-left": "bottom-8 left-8",
    "top-right": "top-24 right-8",
    "top-left": "top-24 left-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className={`fixed ${positionClasses[position]} z-50`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <motion.button
        onClick={toggleTheme}
        className="relative flex items-center gap-3 overflow-hidden"
        animate={{
          width: isExpanded ? "auto" : "56px",
        }}
        transition={{
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        aria-label="Toggle theme"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-[var(--surface)] border-2 border-[var(--border-color)] rounded-full shadow-2xl" />

        {/* Gradient overlay */}
        <motion.div
          className="absolute inset-0 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-300"
          style={{
            background:
              "linear-gradient(135deg, rgba(30, 215, 96, 0.1) 0%, rgba(20, 90, 50, 0.05) 100%)",
          }}
        />

        {/* Border glow on hover */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-[var(--color-green-primary)]"
          initial={{ opacity: 0, scale: 0.95 }}
          whileHover={{ opacity: 0.5, scale: 1 }}
          transition={{ duration: 0.3 }}
        />

        {/* Content container */}
        <div className="relative flex items-center gap-3 px-4 py-3">
          {/* Icon */}
          <motion.div
            className="flex-shrink-0"
            animate={{ rotate: isDark ? 0 : 180 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <AnimatePresence mode="wait">
              {isDark ? (
                <motion.div
                  key="moon"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: 180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Moon className="w-6 h-6 text-[var(--color-green-primary)]" />
                </motion.div>
              ) : (
                <motion.div
                  key="sun"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, rotate: -180 }}
                  transition={{ duration: 0.3 }}
                >
                  <Sun className="w-6 h-6 text-[var(--color-green-primary)]" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Label */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <motion.span
                  initial={{ x: -10 }}
                  animate={{ x: 0 }}
                  exit={{ x: -10 }}
                  className="text-sm font-semibold text-[var(--text-primary)] whitespace-nowrap pr-2"
                >
                  {isDark ? "Light Mode" : "Dark Mode"}
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Ripple effect on click */}
        <motion.div
          className="absolute inset-0 rounded-full bg-[var(--color-green-primary)]"
          initial={{ scale: 0, opacity: 0.5 }}
          whileTap={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      </motion.button>

      {/* Ambient glow underneath */}
      <motion.div
        className="absolute inset-0 -z-10 rounded-full blur-xl"
        animate={{
          background: isDark
            ? "radial-gradient(circle, rgba(30, 215, 96, 0.2) 0%, transparent 70%)"
            : "radial-gradient(circle, rgba(30, 215, 96, 0.15) 0%, transparent 70%)",
          scale: isExpanded ? 1.5 : 1,
        }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

export default FloatingThemeToggleExpanded;
