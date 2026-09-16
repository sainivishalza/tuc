import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";

// Called only from app/api/webhooks/resend/route.ts, after that route has
// already verified the request's Svix signature — nothing here is
// reachable by an unauthenticated caller directly, so unlike everything
// in lib/actions/emailCampaigns.ts these functions deliberately do NOT
// call requireAdminAction(): the webhook's own signature check IS its
// authentication, there's no admin session to check.

interface ResendWebhookEvent {
  type: string;
  created_at?: string;
  data: {
    email_id?: string;
    to?: string[];
    bounce?: { type?: string; subType?: string; message?: string };
  };
}

const COMPLAINT_PAUSE_HOURS = 24;

export async function handleResendWebhookEvent(event: ResendWebhookEvent): Promise<void> {
  const supabase = getSupabaseAdminClient();
  const emailId = event.data.email_id ?? null;
  const recipientEmail = event.data.to?.[0]?.toLowerCase() ?? null;
  const bounceType = event.data.bounce?.type ?? null;
  const bounceSubtype = event.data.bounce?.subType ?? null;

  // Correlate back to the specific send, when we have one — a webhook
  // can also arrive for a transactional email (shipment update, portal
  // login link) that was never a campaign recipient at all, which is
  // fine: it's still logged, just with no campaign_recipient_id.
  let campaignRecipientId: string | null = null;
  if (emailId) {
    const { data: recipient } = await supabase
      .from("email_campaign_recipients")
      .select("id")
      .eq("resend_email_id", emailId)
      .maybeSingle();
    campaignRecipientId = recipient?.id ?? null;
  }

  await supabase.from("email_events").insert({
    type: event.type,
    resend_email_id: emailId,
    recipient_email: recipientEmail,
    campaign_recipient_id: campaignRecipientId,
    bounce_type: bounceType,
    bounce_subtype: bounceSubtype,
    payload: event.data,
  });

  if (event.type === "email.delivered" && campaignRecipientId) {
    await supabase
      .from("email_campaign_recipients")
      .update({ delivered_at: new Date().toISOString() })
      .eq("id", campaignRecipientId);
    return;
  }

  if (event.type === "email.bounced") {
    if (campaignRecipientId) {
      await supabase.from("email_campaign_recipients").update({ status: "bounced" }).eq("id", campaignRecipientId);
    }
    // Only a permanent bounce means the address itself is bad — a
    // temporary one (mailbox full, greylisting) can succeed on a later,
    // unrelated send, so it shouldn't suppress future campaigns.
    if (bounceType === "Permanent" && recipientEmail) {
      await supabase.from("email_unsubscribes").upsert({ email: recipientEmail });
    }
    return;
  }

  if (event.type === "email.complained") {
    if (campaignRecipientId) {
      await supabase.from("email_campaign_recipients").update({ status: "complained" }).eq("id", campaignRecipientId);
    }
    // A spam complaint suppresses the address immediately and
    // unconditionally — unlike a bounce, there's no "temporary" variant
    // to weigh, and continuing to email someone who complained is the
    // single fastest way to tank a sending domain's reputation.
    if (recipientEmail) {
      await supabase.from("email_unsubscribes").upsert({ email: recipientEmail });
    }

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentComplaints } = await supabase
      .from("email_events")
      .select("id", { count: "exact", head: true })
      .eq("type", "email.complained")
      .gte("created_at", oneDayAgo);

    const { data: settings } = await supabase.from("email_send_settings").select("*").eq("id", "default").single();
    if (settings && (recentComplaints ?? 0) >= settings.max_complaints_before_pause) {
      await supabase
        .from("email_send_settings")
        .update({
          paused_until: new Date(Date.now() + COMPLAINT_PAUSE_HOURS * 60 * 60 * 1000).toISOString(),
          pause_reason: `Auto-paused: ${recentComplaints} spam complaint${recentComplaints === 1 ? "" : "s"} in the last 24 hours (threshold ${settings.max_complaints_before_pause}). Review your recent campaigns before resuming.`,
          updated_at: new Date().toISOString(),
        })
        .eq("id", "default");
    }
  }
}
