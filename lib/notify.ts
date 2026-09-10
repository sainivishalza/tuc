import "server-only";
import { sendEmail } from "@/lib/email";
import type { ShipmentStatus, QuoteLineItem, QuoteRequest } from "@/lib/supabase/types";
import { STATUS_LABELS } from "@/lib/shipmentStatus";

const SITE_URL = "https://theuniquechoice.com";

function trackingLink(trackingNumber: string): string {
  return `${SITE_URL}/en/track?number=${encodeURIComponent(trackingNumber)}`;
}

/** Sends and logs failures server-side (hosting logs) so a broken API key
 * or quota issue is at least discoverable — it still never throws or
 * surfaces to the admin/customer, since email is a best-effort side effect. */
async function sendAndLog(params: { to: string; subject: string; html: string }): Promise<void> {
  const result = await sendEmail(params);
  if (!result.ok) {
    console.error(`[notify] failed to email ${params.to} ("${params.subject}"): ${result.message}`);
  }
}

function emailShell(trackingNumber: string, heading: string, bodyHtml: string): string {
  const link = trackingLink(trackingNumber);
  return `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">${heading}</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 8px;">Tracking number: <strong>${trackingNumber}</strong></p>
      ${bodyHtml}
      <a href="${link}" style="display: inline-block; margin-top: 20px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View tracking details
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        If you weren't expecting this, you can ignore this email.
      </p>
    </div>
  `;
}

/** Best-effort — never throws. Callers should not let a failed send block
 * the admin action or customer lookup that triggered it. */
export async function notifyStatusChange(params: {
  customerEmail: string;
  trackingNumber: string;
  newStatus: ShipmentStatus;
}): Promise<void> {
  const label = STATUS_LABELS[params.newStatus] ?? params.newStatus;
  const html = emailShell(
    params.trackingNumber,
    `Your order status is now: ${label}`,
    `<p style="font-size: 14px; margin: 0;">We've updated the status on your order — click below to see the full tracking timeline.</p>`
  );
  await sendAndLog({
    to: params.customerEmail,
    subject: `Update on ${params.trackingNumber}: ${label}`,
    html,
  });
}

export async function notifyNewUpdate(params: {
  customerEmail: string;
  trackingNumber: string;
  description: string;
}): Promise<void> {
  const html = emailShell(
    params.trackingNumber,
    "New update on your order",
    `<p style="font-size: 14px; margin: 0;">${escapeHtml(params.description)}</p>`
  );
  await sendAndLog({
    to: params.customerEmail,
    subject: `New update on ${params.trackingNumber}`,
    html,
  });
}

export async function notifySyncUpdates(params: {
  customerEmail: string;
  trackingNumber: string;
  newStatus: ShipmentStatus | null;
  newEventCount: number;
  latestDescription: string | null;
}): Promise<void> {
  const statusLine = params.newStatus
    ? `<p style="font-size: 14px; margin: 0 0 8px;">Current status: <strong>${STATUS_LABELS[params.newStatus] ?? params.newStatus}</strong></p>`
    : "";
  const latestLine = params.latestDescription
    ? `<p style="font-size: 14px; margin: 0;">Latest: ${escapeHtml(params.latestDescription)}</p>`
    : "";
  const html = emailShell(
    params.trackingNumber,
    `${params.newEventCount} new tracking update${params.newEventCount === 1 ? "" : "s"}`,
    `${statusLine}${latestLine}`
  );
  await sendAndLog({
    to: params.customerEmail,
    subject: `New tracking updates for ${params.trackingNumber}`,
    html,
  });
}

/** Best-effort — never throws. A new lead is worthless if nobody finds
 * out about it until they happen to check the admin panel; this is what
 * actually makes the "we respond within 24 hours" promise on the quote
 * form true. Sent to LEAD_NOTIFICATION_EMAIL, which is separate from
 * RESEND_FROM_EMAIL (the sending address) since they don't have to be
 * the same inbox. */
export async function notifyNewQuoteRequest(params: {
  name: string;
  email: string;
  whatsapp: string | null;
  product: string | null;
  quantity: string | null;
  timeline: string | null;
  message: string | null;
}): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("[notify] new quote request received but LEAD_NOTIFICATION_EMAIL is not set — nobody was notified.");
    return;
  }

  const row = (label: string, value: string | null) =>
    value ? `<p style="font-size: 14px; margin: 0 0 8px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>` : "";

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — New Lead
      </p>
      <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(params.name)} wants a quote</h1>
      ${row("Email", params.email)}
      ${row("WhatsApp", params.whatsapp)}
      ${row("Product category", params.product)}
      ${row("Quantity", params.quantity)}
      ${row("Timeline", params.timeline)}
      ${row("Message", params.message)}
      <a href="${SITE_URL}/admin/quote-requests" style="display: inline-block; margin-top: 20px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View in admin panel
      </a>
    </div>
  `;

  await sendAndLog({
    to,
    subject: `New quote request from ${params.name}`,
    html,
  });
}

/** Best-effort — never throws. Same lead-alert purpose as
 * notifyNewQuoteRequest, for the bulk (multi-line-item) form instead of
 * the single-product wizard. */
export async function notifyNewBulkQuoteRequest(params: {
  name: string;
  email: string;
  whatsapp: string | null;
  timeline: string | null;
  message: string | null;
  items: QuoteLineItem[];
}): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("[notify] new bulk quote request received but LEAD_NOTIFICATION_EMAIL is not set — nobody was notified.");
    return;
  }

  const row = (label: string, value: string | null) =>
    value ? `<p style="font-size: 14px; margin: 0 0 8px;"><strong>${label}:</strong> ${escapeHtml(value)}</p>` : "";

  const itemsTable = `
    <table style="width: 100%; border-collapse: collapse; margin: 12px 0; font-size: 13px;">
      <thead>
        <tr>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Product</th>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Quantity</th>
          <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Notes</th>
        </tr>
      </thead>
      <tbody>
        ${params.items
          .map(
            (item) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(item.product)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(item.quantity)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(item.notes)}</td>
        </tr>`
          )
          .join("")}
      </tbody>
    </table>
  `;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — New Bulk Lead
      </p>
      <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(params.name)} submitted a bulk request (${params.items.length} items)</h1>
      ${row("Email", params.email)}
      ${row("WhatsApp", params.whatsapp)}
      ${row("Timeline", params.timeline)}
      ${row("Message", params.message)}
      ${itemsTable}
      <a href="${SITE_URL}/admin/quote-requests" style="display: inline-block; margin-top: 12px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View in admin panel
      </a>
    </div>
  `;

  await sendAndLog({
    to,
    subject: `New bulk quote request from ${params.name} (${params.items.length} items)`,
    html,
  });
}

/** Best-effort — never throws. Triggered by the /api/cron/digest route
 * (see that file for how it's scheduled) rather than a user action, so
 * unlike the other notify* functions here there's no request to attach
 * this to — it always sends once triggered, including a "nothing new"
 * result, since that confirms the cron actually ran rather than silently
 * not firing. */
export async function notifyDailyDigest(params: {
  newRequests: QuoteRequest[];
  openCount: number;
}): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("[notify] daily digest ready to send but LEAD_NOTIFICATION_EMAIL is not set — nobody was notified.");
    return;
  }

  const rowsHtml =
    params.newRequests.length > 0
      ? params.newRequests
          .map(
            (r) => `
        <tr>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(r.name)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(r.email)}</td>
          <td style="padding: 6px 8px; border-bottom: 1px solid #f3f4f6;">${escapeHtml(r.product ?? "—")}</td>
        </tr>`
          )
          .join("")
      : `<tr><td colspan="3" style="padding: 12px 8px; color: #9ca3af;">No new requests in the last 24 hours.</td></tr>`;

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — Daily Digest
      </p>
      <h1 style="font-size: 20px; margin: 0 0 8px;">${params.newRequests.length} new request${params.newRequests.length === 1 ? "" : "s"} in the last 24 hours</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 16px;">
        <strong>${params.openCount}</strong> total request${params.openCount === 1 ? "" : "s"} still marked "new" and waiting on a reply.
      </p>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Name</th>
            <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Email</th>
            <th style="text-align: left; padding: 6px 8px; border-bottom: 1px solid #e5e7eb;">Product</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
      </table>
      <a href="${SITE_URL}/admin/quote-requests" style="display: inline-block; margin-top: 16px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View in admin panel
      </a>
    </div>
  `;

  await sendAndLog({
    to,
    subject:
      params.newRequests.length > 0
        ? `Daily digest: ${params.newRequests.length} new request${params.newRequests.length === 1 ? "" : "s"}`
        : "Daily digest: no new requests",
    html,
  });
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
