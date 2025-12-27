// lib/supabase/admin.js

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error("Missing Supabase admin environment variables");
}

// Admin client with service role key - only use server-side
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper function to check if we're on the server
export const isServer = typeof window === "undefined";

// Wrapper to ensure admin client is only used server-side
export const getSupabaseAdmin = () => {
  if (!isServer) {
    throw new Error("supabaseAdmin can only be used on the server side");
  }
  return supabaseAdmin;
};
