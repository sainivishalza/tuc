import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

/** Best-effort, never throws — recording that a cron fired must never be
 * what makes the cron's own real work fail. There is no scheduler inside
 * this app at all (see the routes under app/api/cron/), so this table is
 * the only way staff can tell an external Hostinger Cron Job is still
 * actually calling back in, rather than finding out when a customer asks
 * why they never got a follow-up email. */
export async function recordCronRun(name: string, ok: boolean, error?: string): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("cron_runs").upsert({
      name,
      last_run_at: new Date().toISOString(),
      last_ok: ok,
      last_error: ok ? null : (error ?? "Unknown error").slice(0, 2000),
    });
  } catch (err) {
    console.error(`[cronHealth] failed to record run of "${name}":`, err instanceof Error ? err.message : err);
  }
}
