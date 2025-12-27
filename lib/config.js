// lib/config.js

// Server-side configuration
export const serverConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
  flutterwave: {
    secretKey: process.env.FLUTTERWAVE_SECRET_KEY,
  },
};

// Client-side configuration
export const clientConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  flutterwave: {
    publicKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY,
    encryptionKey: process.env.NEXT_PUBLIC_FLUTTERWAVE_ENCRYPTION_KEY,
  },
};

// Validate server config (only runs server-side)
if (typeof window === "undefined") {
  const missingVars = [];

  if (!serverConfig.supabase.url) missingVars.push("NEXT_PUBLIC_SUPABASE_URL");
  if (!serverConfig.supabase.serviceRoleKey)
    missingVars.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!serverConfig.flutterwave.secretKey)
    missingVars.push("FLUTTERWAVE_SECRET_KEY");

  if (missingVars.length > 0) {
    console.error(
      "❌ Missing server environment variables:",
      missingVars.join(", ")
    );
  } else {
    console.log("✅ All server environment variables loaded");
  }
}
