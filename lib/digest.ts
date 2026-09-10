import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import type { QuoteRequest } from "@/lib/supabase/types";

export interface DigestData {
  newRequests: QuoteRequest[];
  openCount: number;
}

/** Not a server action (no "use server" here, deliberately) — an
 * unauthenticated export in a "use server" file becomes a callable RPC
 * endpoint, which would leak every lead's name/email to any caller. This
 * is a plain server-only helper; the only caller is the cron route,
 * which gates access with CRON_SECRET before ever reaching this. */
export async function getDailyDigestData(): Promise<DigestData> {
  const supabase = getSupabaseAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ data: newRequests }, { count: openCount }] = await Promise.all([
    supabase
      .from("quote_requests")
      .select("*")
      .gte("created_at", since)
      .order("created_at", { ascending: false }),
    supabase.from("quote_requests").select("*", { count: "exact", head: true }).eq("status", "new"),
  ]);

  return {
    newRequests: (newRequests ?? []) as QuoteRequest[],
    openCount: openCount ?? 0,
  };
}
