"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { sendEmail } from "@/lib/email";
import { createUnsubscribeToken, verifyUnsubscribeToken } from "@/lib/unsubscribeAuth";
import { renderCampaignEmailHtml, renderCampaignEmailText } from "@/lib/emailTemplateRenderer";
import type {
  EmailTemplate,
  EmailCampaign,
  EmailCampaignSegments,
  EmailCampaignRecipient,
  EmailSendSettings,
  EmailProspect,
} from "@/lib/supabase/types";

const SITE_URL = "https://theuniquechoice.com";

// ---------- Templates ----------

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("email_templates").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as EmailTemplate[];
}

export async function getEmailTemplateById(id: string): Promise<EmailTemplate | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("email_templates").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as EmailTemplate | null;
}

export interface EmailTemplateInput {
  name: string;
  category: EmailTemplate["category"];
  subject: string;
  preheader: string;
  headline: string;
  body_text: string;
  cta_text: string;
  cta_url: string;
  status: EmailTemplate["status"];
}

function validateTemplateInput(input: EmailTemplateInput) {
  if (!input.name.trim() || !input.subject.trim() || !input.headline.trim() || !input.body_text.trim()) {
    throw new Error("Name, subject, headline, and body are required.");
  }
  if ((input.cta_text.trim() && !input.cta_url.trim()) || (!input.cta_text.trim() && input.cta_url.trim())) {
    throw new Error("A call-to-action needs both button text and a URL — or leave both blank.");
  }
}

export async function createEmailTemplate(input: EmailTemplateInput): Promise<string> {
  await requireAdminAction();
  validateTemplateInput(input);
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("email_templates")
    .insert({
      name: input.name.trim(),
      category: input.category,
      subject: input.subject.trim(),
      preheader: input.preheader.trim() || null,
      headline: input.headline.trim(),
      body_text: input.body_text.trim(),
      cta_text: input.cta_text.trim() || null,
      cta_url: input.cta_url.trim() || null,
      status: input.status,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/templates");
  return data.id as string;
}

export async function updateEmailTemplate(id: string, input: EmailTemplateInput): Promise<void> {
  await requireAdminAction();
  validateTemplateInput(input);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("email_templates")
    .update({
      name: input.name.trim(),
      category: input.category,
      subject: input.subject.trim(),
      preheader: input.preheader.trim() || null,
      headline: input.headline.trim(),
      body_text: input.body_text.trim(),
      cta_text: input.cta_text.trim() || null,
      cta_url: input.cta_url.trim() || null,
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/templates");
  revalidatePath(`/admin/email/templates/${id}`);
}

export async function deleteEmailTemplate(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("email_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/templates");
}

/** Sends one render of a template straight to a chosen address, bypassing
 * the campaign/recipient machinery entirely — a way to see the actual
 * rendered email in a real inbox before committing to a real send. Takes
 * the same draft fields as the editor so an unsaved draft can be tested
 * too, not just a saved template. */
export async function sendTestEmail(
  input: Pick<EmailTemplateInput, "subject" | "preheader" | "headline" | "body_text" | "cta_text" | "cta_url">,
  toEmail: string
): Promise<{ ok: boolean; message: string }> {
  await requireAdminAction();
  if (!toEmail.trim() || !toEmail.includes("@")) {
    return { ok: false, message: "Enter a valid email address to send the test to." };
  }
  const template = {
    subject: `[TEST] ${input.subject}`,
    preheader: input.preheader || null,
    headline: input.headline,
    body_text: input.body_text,
    cta_text: input.cta_text || null,
    cta_url: input.cta_url || null,
  };
  const html = renderCampaignEmailHtml(template, null);
  const text = renderCampaignEmailText(template, null);
  const result = await sendEmail({ to: toEmail.trim(), subject: template.subject, html, text });
  return { ok: result.ok, message: result.ok ? "Test email sent." : result.message };
}

// ---------- Prospects (cold-outreach list) ----------

export async function getEmailProspects(): Promise<EmailProspect[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("email_prospects").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as EmailProspect[];
}

export async function addEmailProspect(email: string, name: string, note: string): Promise<void> {
  await requireAdminAction();
  const trimmed = email.trim().toLowerCase();
  if (!trimmed || !trimmed.includes("@")) throw new Error("Enter a valid email address.");
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("email_prospects")
    .upsert({ email: trimmed, name: name.trim() || null, note: note.trim() || null }, { onConflict: "email", ignoreDuplicates: true });
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/prospects");
}

const EMAIL_MATCH = /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+/g;

/** Accepts raw pasted text OR the raw text content of an uploaded file
 * (CSV, TXT, one-per-line, comma-separated — anything) and just pulls
 * every valid-looking email address out of it with a regex, rather than
 * parsing columns. That's deliberately more forgiving than real CSV
 * parsing: it works the same whether the admin pastes a list, exports a
 * spreadsheet, or uploads an address book, with no format to get wrong. */
export async function bulkImportEmailProspects(rawText: string): Promise<{ added: number; total: number }> {
  await requireAdminAction();
  const matches = rawText.match(EMAIL_MATCH) ?? [];
  const unique = Array.from(new Set(matches.map((e) => e.trim().toLowerCase())));
  if (unique.length === 0) return { added: 0, total: 0 };

  const supabase = getSupabaseAdminClient();
  const rows = unique.map((email) => ({ email }));
  const { data, error } = await supabase
    .from("email_prospects")
    .upsert(rows, { onConflict: "email", ignoreDuplicates: true })
    .select("id");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/prospects");
  return { added: data?.length ?? 0, total: unique.length };
}

export async function deleteEmailProspect(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("email_prospects").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email/prospects");
}

// ---------- Audience ----------

async function collectAudienceEmails(segments: EmailCampaignSegments): Promise<Map<string, string>> {
  const supabase = getSupabaseAdminClient();
  const emails = new Map<string, string>(); // lowercased -> original casing

  const add = (raw: string | null | undefined) => {
    if (!raw) return;
    const trimmed = raw.trim();
    if (!trimmed || !trimmed.includes("@")) return;
    const key = trimmed.toLowerCase();
    if (!emails.has(key)) emails.set(key, trimmed);
  };

  const queries: Promise<void>[] = [];
  if (segments.clients) {
    queries.push(
      (async () => {
        const { data } = await supabase.from("clients").select("email");
        (data ?? []).forEach((r) => add((r as { email: string }).email));
      })()
    );
  }
  if (segments.suppliers) {
    queries.push(
      (async () => {
        const { data } = await supabase.from("suppliers").select("email");
        (data ?? []).forEach((r) => add((r as { email: string }).email));
      })()
    );
  }
  if (segments.newsletter) {
    queries.push(
      (async () => {
        const { data } = await supabase.from("newsletter_subscribers").select("email");
        (data ?? []).forEach((r) => add((r as { email: string }).email));
      })()
    );
  }
  if (segments.prospects) {
    queries.push(
      (async () => {
        const { data } = await supabase.from("email_prospects").select("email");
        (data ?? []).forEach((r) => add((r as { email: string }).email));
      })()
    );
  }
  await Promise.all(queries);

  if (emails.size > 0) {
    const { data: unsubbed } = await supabase.from("email_unsubscribes").select("email");
    (unsubbed ?? []).forEach((r) => emails.delete((r as { email: string }).email.toLowerCase()));
  }

  return emails;
}

export async function getAudienceCount(segments: EmailCampaignSegments): Promise<number> {
  await requireAdminAction();
  const emails = await collectAudienceEmails(segments);
  return emails.size;
}

// ---------- Campaigns ----------

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("email_campaigns").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as EmailCampaign[];
}

export async function getEmailCampaignById(
  id: string
): Promise<{ campaign: EmailCampaign; template: EmailTemplate | null; recipients: EmailCampaignRecipient[] } | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: campaign, error } = await supabase.from("email_campaigns").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  if (!campaign) return null;

  const [{ data: template }, { data: recipients }] = await Promise.all([
    campaign.template_id
      ? supabase.from("email_templates").select("*").eq("id", campaign.template_id).maybeSingle()
      : Promise.resolve({ data: null }),
    supabase
      .from("email_campaign_recipients")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true })
      .limit(500),
  ]);

  return {
    campaign: campaign as EmailCampaign,
    template: template as EmailTemplate | null,
    recipients: (recipients ?? []) as EmailCampaignRecipient[],
  };
}

export async function createEmailCampaign(
  templateId: string,
  name: string,
  segments: EmailCampaignSegments
): Promise<string> {
  await requireAdminAction();
  if (!name.trim()) throw new Error("Give the campaign a name.");
  if (!segments.clients && !segments.suppliers && !segments.newsletter) {
    throw new Error("Pick at least one audience.");
  }

  const supabase = getSupabaseAdminClient();
  const emails = await collectAudienceEmails(segments);
  if (emails.size === 0) {
    throw new Error("No recipients match that audience — nothing to send.");
  }

  const { data: campaign, error } = await supabase
    .from("email_campaigns")
    .insert({
      template_id: templateId,
      name: name.trim(),
      segments,
      status: "draft",
      total_recipients: emails.size,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  const rows = Array.from(emails.values()).map((email) => ({ campaign_id: campaign.id, email, status: "pending" }));
  const { error: recipientsError } = await supabase.from("email_campaign_recipients").insert(rows);
  if (recipientsError) throw new Error(recipientsError.message);

  revalidatePath("/admin/email");
  return campaign.id as string;
}

// ---------- Send settings / circuit breaker ----------

export async function getEmailSendSettings(): Promise<EmailSendSettings> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("email_send_settings").select("*").eq("id", "default").single();
  if (error) throw new Error(error.message);
  return data as EmailSendSettings;
}

export async function updateEmailSendSettings(input: {
  max_per_hour: number;
  max_per_batch: number;
  failure_pause_threshold_pct: number;
}): Promise<void> {
  await requireAdminAction();
  if (input.max_per_hour < 1 || input.max_per_batch < 1) {
    throw new Error("Limits must be at least 1.");
  }
  if (input.failure_pause_threshold_pct < 1 || input.failure_pause_threshold_pct > 100) {
    throw new Error("Failure threshold must be between 1 and 100.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("email_send_settings")
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email");
}

export async function pauseSending(reason: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  // Far-future timestamp — "paused indefinitely" until an admin resumes,
  // rather than a magic null-vs-date dual meaning on the same column.
  const { error } = await supabase
    .from("email_send_settings")
    .update({ paused_until: "2099-01-01T00:00:00Z", pause_reason: reason || "Paused by admin.", updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email");
}

export async function resumeSending(): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("email_send_settings")
    .update({ paused_until: null, pause_reason: null, updated_at: new Date().toISOString() })
    .eq("id", "default");
  if (error) throw new Error(error.message);
  revalidatePath("/admin/email");
}

export interface SendBatchResult {
  sentThisBatch: number;
  failedThisBatch: number;
  remaining: number;
  paused: boolean;
  pauseReason: string | null;
  hourlyLimitReached: boolean;
}

export async function sendNextBatch(campaignId: string): Promise<SendBatchResult> {
  await requireAdminAction();
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
        .update({ status: "sent", sent_at: new Date().toISOString(), error: null })
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

// ---------- Unsubscribe (public) ----------

export async function unsubscribeByToken(token: string): Promise<{ ok: boolean; email?: string }> {
  const email = verifyUnsubscribeToken(token);
  if (!email) return { ok: false };
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("email_unsubscribes").upsert({ email: email.toLowerCase() });
  if (error) return { ok: false };
  return { ok: true, email };
}
