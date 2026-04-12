// components/shared/profile/ProfileMenu.jsx (UPDATED)

"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { MoreVertical, UserPen, LogOut, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import DeleteAccountModal from "@/components/common/modals/delete";
import EditProfileModal from "@/components/common/modals/edit";

export default function ProfileMenu({ profile, onProfileUpdate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef(null);
  const router = useRouter();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleEditProfile = () => {
    setIsOpen(false);
    setShowEditModal(true);
  };

  const handleDeleteAccount = () => {
    setIsOpen(false);
    setShowDeleteModal(true);
  };

  const menuItems = [
    {
      icon: <UserPen className="w-4 h-4" />,
      label: "Edit Profile",
      onClick: handleEditProfile,
      color: "var(--text-primary)",
    },
    {
      icon: <LogOut className="w-4 h-4" />,
      label: "Sign Out",
      onClick: handleSignOut,
      color: "var(--text-primary)",
      loading: isSigningOut,
    },
    {
      icon: <Trash2 className="w-4 h-4" />,
      label: "Delete Account",
      onClick: handleDeleteAccount,
      color: "#ef4444",
      destructive: true,
    },
  ];

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="card flex items-center gap-2 px-4 py-2 hover:shadow-card-hover"
        >
          <MoreVertical className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
          <span
            className="text-sm font-medium hidden sm:inline"
            style={{ color: "var(--text-primary)" }}
          >
            Settings
          </span>
        </button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="card absolute right-0 mt-2 w-64 py-2 z-50"
              style={{ boxShadow: "var(--shadow-modal)" }}
            >
              {/* User Info Header */}
              <div className="px-4 py-3 border-b border-(--color-black-border)">
                <p
                  className="font-semibold truncate"
                  style={{ color: "var(--text-primary)" }}
                >
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p
                  className="text-sm truncate"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {profile?.email}
                </p>
              </div>

              {/* Menu Items */}
              <div className="py-2">
                {menuItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={item.onClick}
                    disabled={item.loading}
                    className="w-full flex items-center gap-3 px-4 py-3 transition-colors duration-150 hover:bg-(--color-black-elevated) disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: item.color }}
                  >
                    {item.loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      item.icon
                    )}
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        profile={profile}
        onUpdate={onProfileUpdate}
      />

      {/* Delete Account Modal */}
      <DeleteAccountModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        profile={profile}
      />
    </>
  );
}
