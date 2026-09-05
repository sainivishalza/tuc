import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Privileged client — bypasses row-level security entirely.
 * Server-only (the `server-only` import throws if ever bundled into
 * client code). Only call this from code paths already gated by the
 * admin session check (see lib/adminAuth.ts).
 */
export function getSupabaseAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
  }
  return createClient(url, key, {
    auth: { persistSession: false },
  });
}
