import { createClient } from "@supabase/supabase-js";

/**
 * Public client, safe for both server and browser use.
 * Uses the anon/publishable key — every operation goes through
 * the row-level security policies defined on each table.
 */
export function getSupabasePublicClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
