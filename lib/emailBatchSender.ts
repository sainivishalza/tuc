import "server-only";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { sendEmail } from "@/lib/email";
import { createUnsubscribeToken } from "@/lib/unsubscribeAuth";
import { renderCampaignEmailHtml, renderCampaignEmailText } from "@/lib/emailTemplateRenderer";

const SITE_URL = "https://theuniquechoice.com";

export interface SendBatchResult {
  sentThisBatch: number;
  failedThisBatch: number;
  remaining: number;
  paused: boolean;
  pauseReason: string | null;
  hourlyLimitReached: boolean;
}

// The actual batch-send logic — shared by the admin's manual "send next
// batch" click (lib/actions/emailCampaigns.ts, behind requireAdminAction)
// and the scheduled-campaigns cron route (lib/scheduledCampaigns.ts, which
// has no admin session to check, same as the Resend webhook handler).
export async function sendCampaignBatch(campaignId: string): Promise<SendBatchResult> {
  const supabase = getSupabaseAdminClient();

  const { data: settings, error: settingsError } = await supabase
    .from("email_send_settings")
    .select("*")
    .eq("id", "default")
    .single();
  if (settingsError) throw new Error(settingsError.message);

  const now = new Date();
  if (settings.paused_until && new Date(settings.paused_until) > now) {
    return { sentThisBatch: 0, failedThisBatch: 0, remaining: 0, paused: true, pauseReason: settings.pause_reason, hourlyLimitReached: false };
  }

  const { data: campaign, error: campaignError } = await supabase
    .from("email_campaigns")
    .select("*")
    .eq("id", campaignId)
    .single();
  if (campaignError) throw new Error(campaignError.message);

  const { data: template } = campaign.template_id
    ? await supabase.from("email_templates").select("*").eq("id", campaign.template_id).maybeSingle()
    : { data: null };
  if (!template) throw new Error("This campaign's template no longer exists.");

  // Global hourly cap — counted across every campaign, not just this one,
  // since it's protecting the sending domain's reputation as a whole.
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const { count: sentLastHour } = await supabase
    .from("email_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", oneHourAgo);

  const hourlyRemaining = Math.max(0, settings.max_per_hour - (sentLastHour ?? 0));
  if (hourlyRemaining === 0) {
    return { sentThisBatch: 0, failedThisBatch: 0, remaining: 0, paused: false, pauseReason: null, hourlyLimitReached: true };
  }

  const batchSize = Math.min(settings.max_per_batch, hourlyRemaining);
  const { data: pending, error: pendingError } = await supabase
    .from("email_campaign_recipients")
    .select("*")
    .eq("campaign_id", campaignId)
    .eq("status", "pending")
    .limit(batchSize);
  if (pendingError) throw new Error(pendingError.message);

  if (!campaign.started_at) {
    await supabase.from("email_campaigns").update({ status: "sending", started_at: now.toISOString() }).eq("id", campaignId);
  }

  let sentThisBatch = 0;
  let failedThisBatch = 0;

  for (const recipient of pending ?? []) {
    const token = createUnsubscribeToken(recipient.email);
    const unsubscribeUrl = token ? `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}` : null;

    const html = renderCampaignEmailHtml(template, unsubscribeUrl);
    const text = renderCampaignEmailText(template, unsubscribeUrl);
    const headers = unsubscribeUrl
      ? { "List-Unsubscribe": `<${unsubscribeUrl}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" }
      : undefined;

    const result = await sendEmail({ to: recipient.email, subject: template.subject, html, text, headers });

    if (result.ok) {
      sentThisBatch += 1;
      await supabase
        .from("email_campaign_recipients")
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null, resend_email_id: result.id ?? null })
        .eq("id", recipient.id);
    } else {
      failedThisBatch += 1;
      console.error(`[email-campaign] failed to send to ${recipient.email}: ${result.message}`);
      await supabase
        .from("email_campaign_recipients")
        .update({ status: "failed", error: result.message })
        .eq("id", recipient.id);
    }
  }

  const batchTotal = sentThisBatch + failedThisBatch;
  const failurePct = batchTotal > 0 ? (failedThisBatch / batchTotal) * 100 : 0;
  // Only trip the breaker on a batch with enough volume to mean
  // something — a single bad address in a 2-recipient batch shouldn't
  // halt the whole campaign the same way a 25% failure rate across 25
  // sends should.
  let paused = false;
  let pauseReason: string | null = null;
  if (batchTotal >= 5 && failurePct >= settings.failure_pause_threshold_pct) {
    paused = true;
    pauseReason = `Auto-paused: ${failedThisBatch}/${batchTotal} sends failed in the last batch (${Math.round(failurePct)}%, threshold ${settings.failure_pause_threshold_pct}%).`;
    await supabase
      .from("email_send_settings")
      .update({ paused_until: new Date(now.getTime() + 60 * 60 * 1000).toISOString(), pause_reason: pauseReason, updated_at: now.toISOString() })
      .eq("id", "default");
  }

  const { count: remainingCount } = await supabase
    .from("email_campaign_recipients")
    .select("id", { count: "exact", head: true })
    .eq("campaign_id", campaignId)
    .eq("status", "pending");

  const newSentCount = campaign.sent_count + sentThisBatch;
  const newFailedCount = campaign.failed_count + failedThisBatch;
  const remaining = remainingCount ?? 0;

  await supabase
    .from("email_campaigns")
    .update({
      sent_count: newSentCount,
      failed_count: newFailedCount,
      status: remaining === 0 ? "completed" : paused ? "paused" : "sending",
      completed_at: remaining === 0 ? now.toISOString() : null,
    })
    .eq("id", campaignId);

  revalidatePath(`/admin/email/campaigns/${campaignId}`);
  revalidatePath("/admin/email");

  return { sentThisBatch, failedThisBatch, remaining, paused, pauseReason, hourlyLimitReached: false };
}
