// app/admin/dashboard/layout.jsx

"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAdminAuth } from "@/hooks/use-admin-auth";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BookOpen,
  UserCircle,
  Settings,
  LogOut,
  Menu,
  X,
  Activity,
  ChevronDown,
} from "lucide-react";

const navigation = [
  {
    name: "Dashboard",
    href: "/admin/dashboard",
    icon: LayoutDashboard,
    permission: "canViewAnalytics",
  },
  {
    name: "Students",
    href: "/admin/dashboard/students",
    icon: Users,
    permission: "canManageUsers",
  },
  {
    name: "Payments",
    href: "/admin/dashboard/payments",
    icon: CreditCard,
    permission: "canViewAnalytics",
  },
  {
    name: "Week Content",
    href: "/admin/dashboard/content",
    icon: BookOpen,
    permission: "canManageContent",
  },
  {
    name: "Lecturers",
    href: "/admin/dashboard/lecturers",
    icon: UserCircle,
    permission: "canManageUsers",
  },
  {
    name: "Activity Logs",
    href: "/admin/dashboard/activity",
    icon: Activity,
    permission: "isSuperAdmin",
  },
];

export default function AdminDashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const { adminData, isLoading, logout, isLoggingOut } = useAdminAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [now, setNow] = useState(() => new Date());

  // Tick the clock every minute
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(interval);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !adminData) {
      router.push("/lead-admin/login");
    }
  }, [isLoading, adminData, router]);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [sidebarOpen]);

  // Memoize filtered navigation to prevent re-calculation
  const filteredNavigation = useMemo(() => {
    if (!adminData?.permissions) return [];

    return navigation.filter((item) => {
      if (!item.permission) return true;
      return adminData.permissions[item.permission];
    });
  }, [adminData?.permissions]);

  // Show loading state
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--color-black-base)" }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 rounded-full mx-auto mb-4"
            style={{
              borderColor: "var(--color-black-border)",
              borderTopColor: "var(--color-green-primary)",
            }}
          />
          <p style={{ color: "var(--text-secondary)" }}>Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated
  if (!adminData) {
    return null;
  }

  const { lecturer, permissions } = adminData;

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--color-black-base)" }}
    >
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Fixed on Desktop, Slide-in on Mobile */}
      <aside
        className={`
          fixed top-0 left-0 h-full w-72 z-50
          lg:translate-x-0 transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
        style={{
          background: "var(--surface)",
          borderRight: "1px solid var(--border-color)",
          boxShadow: "var(--shadow-lg)",
        }}
      >
        {/* Logo */}
        <div
          className="h-20 flex items-center justify-between px-6 border-b shrink-0"
          style={{ borderColor: "var(--border-color)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "#1ed760",
              }}
            >
              <span className="text-white font-bold text-lg">L</span>
            </div>
            <div>
              <h1
                className="font-bold text-lg"
                style={{
                  fontFamily: "var(--font-satoshi)",
                  color: "var(--text-primary)",
                }}
              >
                LEAD Admin
              </h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Dashboard
              </p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
            style={{ color: "var(--text-muted)" }}
            aria-label="Close sidebar"
          >
            <X className="w-6 h-6" aria-hidden="true" />
          </button>
        </div>

        {/* Navigation */}
        <nav
          className="p-4 space-y-1 overflow-y-auto"
          style={{ height: "calc(100vh - 160px)" }}
        >
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors duration-150 ${
                  isActive
                    ? "text-white"
                    : "text-(--text-primary) hover:bg-(--color-black-elevated)"
                }`}
                style={{
                  background: isActive
                    ? "var(--color-green-primary)"
                    : undefined,
                }}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div
          className="absolute bottom-0 left-0 right-0 p-4 border-t shrink-0"
          style={{ borderColor: "var(--color-black-border)", height: "80px" }}
        >
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors duration-150 bg-(--color-black-elevated) hover:bg-(--color-black-border)"
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: "#1ed760",
                }}
              >
                <span className="text-white font-bold">
                  {lecturer.name?.charAt(0) || "A"}
                </span>
              </div>
              <div className="flex-1 text-left min-w-0">
                <p
                  className="text-sm font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {lecturer.name}
                </p>
                <p
                  className="text-xs truncate"
                  style={{ color: "var(--text-muted)" }}
                >
                  {lecturer.role === "super_admin"
                    ? "Super Administrator"
                    : "Administrator"}
                </p>
              </div>
              <ChevronDown
                className={`w-5 h-5 transition-transform shrink-0 ${
                  userMenuOpen ? "rotate-180" : ""
                }`}
                style={{ color: "var(--text-muted)" }}
              />
            </button>

            {/* User Menu Dropdown */}
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute bottom-full left-0 right-0 mb-2 rounded-xl overflow-hidden"
                  style={{
                    background: "var(--color-black-elevated)",
                    border: "1px solid var(--color-black-border)",
                    boxShadow: "var(--shadow-xl)",
                  }}
                >
                  <button
                    onClick={logout}
                    disabled={isLoggingOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-150 hover:bg-(--color-black-border) disabled:opacity-50 text-(--text-primary)"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="font-medium">
                      {isLoggingOut ? "Logging out..." : "Logout"}
                    </span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="lg:ml-72 min-h-screen flex flex-col">
        {/* Top Bar */}
        <header
          className="h-20 sticky top-0 z-30 flex items-center justify-between px-6 border-b backdrop-blur-lg shrink-0"
          style={{
            background: "rgba(10, 13, 18, 0.8)",
            borderColor: "var(--color-black-border)",
          }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden"
            style={{ color: "var(--text-primary)" }}
            aria-label="Open navigation menu"
          >
            <Menu className="w-6 h-6" aria-hidden="true" />
          </button>

          <div className="flex items-center gap-4 ml-auto">
            {/* Date & Time */}
            <div className="hidden md:block text-right">
              <p
                className="text-sm font-semibold"
                style={{ color: "var(--text-primary)" }}
              >
                {now.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {now.toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
