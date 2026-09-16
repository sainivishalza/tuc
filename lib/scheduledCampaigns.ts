import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { sendCampaignBatch } from "@/lib/emailBatchSender";

export interface ScheduledCampaignsResult {
  campaignId: string;
  name: string;
  sentThisBatch: number;
  failedThisBatch: number;
  remaining: number;
  paused: boolean;
  hourlyLimitReached: boolean;
}

// Called only from app/api/cron/send-scheduled-campaigns/route.ts, after
// that route has already checked the CRON_SECRET — same convention as
// lib/emailWebhookHandler.ts: no admin session exists here, the caller's
// own check is the authentication, so this deliberately doesn't call
// requireAdminAction().
//
// One batch per due campaign per invocation — exactly what a manual
// "Send next batch" click does — so calling this on a schedule (every
// 15 minutes, say) reproduces an admin repeatedly clicking that button,
// still bounded by the same hourly/per-batch caps and circuit breaker.
export async function processScheduledCampaigns(): Promise<ScheduledCampaignsResult[]> {
  const supabase = getSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data: due, error } = await supabase
    .from("email_campaigns")
    .select("id, name")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", now)
    .in("status", ["scheduled", "sending", "paused"]);
  if (error) throw new Error(error.message);

  const results: ScheduledCampaignsResult[] = [];
  for (const campaign of due ?? []) {
    const batch = await sendCampaignBatch(campaign.id);
    results.push({
      campaignId: campaign.id,
      name: campaign.name,
      sentThisBatch: batch.sentThisBatch,
      failedThisBatch: batch.failedThisBatch,
      remaining: batch.remaining,
      paused: batch.paused,
      hourlyLimitReached: batch.hourlyLimitReached,
    });
  }
  return results;
}
