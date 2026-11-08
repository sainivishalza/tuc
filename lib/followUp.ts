import "server-only";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { notifyQuoteRequestFollowUp, notifySourcingRequestFollowUp } from "@/lib/notify";

// How long a request sits untouched before the customer gets one
// automated "still with us?" nudge — long enough that it isn't sent to
// someone who was just quoted within the hour, short enough that it
// still catches a lead before they've written the business off.
const FOLLOW_UP_AFTER_MS = 3 * 24 * 60 * 60 * 1000;

/** Not a server action, same reasoning as getDailyDigestData in
 * lib/digest.ts — this sends real customer emails and must only ever
 * run from the CRON_SECRET-gated route, never be reachable as a callable
 * RPC. Quote requests still sitting at "new" (nobody's updated the
 * status yet) past the threshold, that haven't already been nudged,
 * get one reminder email each; followup_sent_at is then set so it never
 * fires twice for the same request. */
export async function sendQuoteRequestFollowUps(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - FOLLOW_UP_AFTER_MS).toISOString();

  const { data, error } = await supabase
    .from("quote_requests")
    .select("id, name, email, product")
    .eq("status", "new")
    .is("followup_sent_at", null)
    .lte("created_at", cutoff);

  if (error || !data || data.length === 0) return 0;

  let sent = 0;
  for (const row of data) {
    await notifyQuoteRequestFollowUp({ name: row.name, email: row.email, product: row.product });
    const { error: updateError } = await supabase
      .from("quote_requests")
      .update({ followup_sent_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!updateError) sent++;
  }
  return sent;
}

/** Same shape as the quote-request version, for approved sourcing
 * requests that no supplier has expressed interest in yet — the
 * customer posted a real requirement and heard nothing back, which is
 * exactly the silent-failure case this feature exists to catch. */
export async function sendSourcingRequestFollowUps(): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const cutoff = new Date(Date.now() - FOLLOW_UP_AFTER_MS).toISOString();

  const [{ data: candidates, error }, { data: interests }] = await Promise.all([
    supabase
      .from("sourcing_requests")
      .select("id, title, customer_name, customer_email")
      .eq("status", "approved")
      .is("followup_sent_at", null)
      .lte("created_at", cutoff),
    supabase.from("sourcing_request_interests").select("sourcing_request_id"),
  ]);

  if (error || !candidates || candidates.length === 0) return 0;

  const interestedIds = new Set((interests ?? []).map((i) => i.sourcing_request_id as string));
  const uninterested = candidates.filter((r) => !interestedIds.has(r.id));
  if (uninterested.length === 0) return 0;

  let sent = 0;
  for (const row of uninterested) {
    await notifySourcingRequestFollowUp({
      customerName: row.customer_name,
      customerEmail: row.customer_email,
      title: row.title,
    });
    const { error: updateError } = await supabase
      .from("sourcing_requests")
      .update({ followup_sent_at: new Date().toISOString() })
      .eq("id", row.id);
    if (!updateError) sent++;
  }
  return sent;
}
