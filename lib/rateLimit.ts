import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

const DEFAULT_MAX_ATTEMPTS = 5;
const DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes

export interface RateLimitOptions {
  /** Attempts allowed within the window. Defaults to 5. */
  maxAttempts?: number;
  /** Window length in ms. Defaults to 15 minutes. */
  windowMs?: number;
}

/** Read-only — does not itself count as an attempt. Callers check first,
 * then call recordFailedAttempt (or not, e.g. a correct admin password
 * shouldn't count against the limit) depending on what happened. */
export async function checkRateLimit(key: string): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("rate_limits")
    .select("count, max_attempts, reset_at")
    .eq("key", key)
    .maybeSingle();

  if (!data) return { allowed: true };
  const resetAt = new Date(data.reset_at).getTime();
  if (Date.now() > resetAt) return { allowed: true };
  if (data.count >= data.max_attempts) {
    return { allowed: false, retryAfterMs: resetAt - Date.now() };
  }
  return { allowed: true };
}

/** Persisted in Postgres (not in-memory) so the count survives a
 * deploy/restart — this project redeploys often, and an in-memory
 * counter would hand an attacker a free reset every time. The increment
 * itself happens in a single atomic upsert (see the increment_rate_limit
 * migration) so two concurrent requests for the same key can't both read
 * "under the limit" before either writes. */
export async function recordFailedAttempt(key: string, options: RateLimitOptions = {}): Promise<void> {
  const maxAttempts = options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
  const windowMs = options.windowMs ?? DEFAULT_WINDOW_MS;
  const supabase = getSupabaseAdminClient();
  await supabase.rpc("increment_rate_limit", {
    p_key: key,
    p_max_attempts: maxAttempts,
    p_window_ms: windowMs,
  });
}

export async function clearRateLimit(key: string): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("rate_limits").delete().eq("key", key);
}
