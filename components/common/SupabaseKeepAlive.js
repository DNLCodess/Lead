"use client";

import { useEffect } from "react";

const INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

export default function SupabaseKeepAlive() {
  useEffect(() => {
    const ping = async () => {
      try {
        await fetch("/api/keep-alive");
      } catch {
        // silently ignore — this is a best-effort background ping
      }
    };

    ping();
    const id = setInterval(ping, INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  return null;
}
