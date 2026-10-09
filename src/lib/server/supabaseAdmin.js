import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client using the service-role key.
// It lives under $lib/server so SvelteKit refuses to bundle it into client code.
//
// Required env var (Vercel, server only, never prefixed with VITE_/PUBLIC_):
//   SUPABASE_SERVICE_ROLE_KEY
// The discount-code RPCs are only executable by service_role.
const url =
  process.env.SUPABASE_PROJECT_URL || import.meta.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!serviceRoleKey) {
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY is not set: discount code operations will fail.",
  );
}

export const supabaseAdmin = createClient(url, serviceRoleKey || "missing-key", {
  auth: { persistSession: false, autoRefreshToken: false },
});
