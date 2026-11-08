import "server-only";
import { sendEmail } from "@/lib/email";
import { whatsappLink } from "@/lib/whatsapp";
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

/** Best-effort — never throws. A new supplier registration sits in
 * "pending" until an admin reviews it, so this is what actually makes
 * that review happen promptly instead of a submission quietly waiting
 * unnoticed in the admin panel. */
export async function notifyNewSupplierRegistration(params: {
  companyName: string;
  contactName: string;
  email: string;
}): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("[notify] new supplier registration received but LEAD_NOTIFICATION_EMAIL is not set — nobody was notified.");
    return;
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — New Supplier Registration
      </p>
      <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(params.companyName)} wants to be listed as a verified supplier</h1>
      <p style="font-size: 14px; margin: 0 0 8px;"><strong>Contact:</strong> ${escapeHtml(params.contactName)}</p>
      <p style="font-size: 14px; margin: 0 0 8px;"><strong>Email:</strong> ${escapeHtml(params.email)}</p>
      <p style="font-size: 14px; margin: 12px 0 0;">Review their submitted documents before approving — nothing shows on the public site until you do.</p>
      <a href="${SITE_URL}/admin/suppliers" style="display: inline-block; margin-top: 20px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Review in admin panel
      </a>
    </div>
  `;

  await sendAndLog({
    to,
    subject: `New supplier registration: ${params.companyName}`,
    html,
  });
}

/** Best-effort — never throws. Same lead-alert purpose as
 * notifyNewQuoteRequest, for a customer-posted Sourcing Request. */
export async function notifyNewSourcingRequest(params: {
  title: string;
  customerName: string;
  customerEmail: string;
}): Promise<void> {
  const to = process.env.LEAD_NOTIFICATION_EMAIL;
  if (!to) {
    console.error("[notify] new sourcing request received but LEAD_NOTIFICATION_EMAIL is not set — nobody was notified.");
    return;
  }

  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — New Sourcing Request
      </p>
      <h1 style="font-size: 20px; margin: 0 0 16px;">${escapeHtml(params.title)}</h1>
      <p style="font-size: 14px; margin: 0 0 8px;"><strong>From:</strong> ${escapeHtml(params.customerName)} (${escapeHtml(params.customerEmail)})</p>
      <p style="font-size: 14px; margin: 12px 0 0;">Nothing shows on the public board until you review and approve it.</p>
      <a href="${SITE_URL}/admin/sourcing-requests" style="display: inline-block; margin-top: 20px; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Review in admin panel
      </a>
    </div>
  `;

  await sendAndLog({ to, subject: `New sourcing request: ${params.title}`, html });
}

/** Best-effort — never throws. Sent to every supplier whose category
 * matches a request the moment staff approves it, so engagement doesn't
 * depend on suppliers remembering to check the board themselves. */
export async function notifySourcingRequestApprovedToSuppliers(params: {
  title: string;
  description: string;
  requestId: string;
  supplierEmails: string[];
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — New Sourcing Request
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">${escapeHtml(params.title)}</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 16px;">${escapeHtml(params.description.slice(0, 240))}${params.description.length > 240 ? "…" : ""}</p>
      <a href="${SITE_URL}/supplier-portal/requirements" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View &amp; respond
      </a>
    </div>
  `;

  await Promise.all(
    params.supplierEmails.map((to) =>
      sendAndLog({ to, subject: `New sourcing request matching your category: ${params.title}`, html })
    )
  );
}

/** Best-effort — never throws. Staff hand-picked these specific suppliers
 * for this requirement, so the email makes that explicit rather than
 * reading like the generic category-match notification. */
export async function notifySourcingRequestPush(params: {
  title: string;
  description: string;
  supplierEmails: string[];
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice — You Were Selected
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">Our team thought you'd be a good fit for: ${escapeHtml(params.title)}</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 16px;">${escapeHtml(params.description.slice(0, 240))}${params.description.length > 240 ? "…" : ""}</p>
      <a href="${SITE_URL}/supplier-portal/requirements" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        View &amp; respond
      </a>
    </div>
  `;

  await Promise.all(
    params.supplierEmails.map((to) => sendAndLog({ to, subject: `You were selected for a sourcing request: ${params.title}`, html }))
  );
}

/** Best-effort — never throws. Keeps the customer engaged after posting —
 * otherwise they have no way to know the board is working until a
 * supplier actually reaches out directly. */
export async function notifySourcingRequestInterest(params: {
  customerEmail: string;
  title: string;
  interestCount: number;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">
        ${params.interestCount} supplier${params.interestCount === 1 ? "" : "s"} interested in your requirement
      </h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0;">
        "${escapeHtml(params.title)}" — a supplier has your contact details now and may reach out to you directly.
      </p>
    </div>
  `;

  await sendAndLog({
    to: params.customerEmail,
    subject: `${params.interestCount} supplier${params.interestCount === 1 ? "" : "s"} interested in your requirement`,
    html,
  });
}

/** Best-effort — never throws. The one automated nudge a customer gets
 * if their quote request sits at "new" for a few days with no staff
 * reply — see lib/followUp.ts, which gates how often this can fire per
 * request. Deliberately short and low-pressure (a check-in, not a sales
 * push), since this goes out with no human review. */
export async function notifyQuoteRequestFollowUp(params: {
  name: string;
  email: string;
  product: string | null;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">Just checking in, ${escapeHtml(params.name)}</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 16px;">
        We received your quote request${params.product ? ` for ${escapeHtml(params.product)}` : ""} a few days ago and wanted
        to make sure it hasn't fallen through the cracks. If you still need help, just reply to this email or message us
        directly and we'll get back to you right away.
      </p>
      <a href="${whatsappLink(`Hi! Following up on my quote request${params.product ? ` for ${params.product}` : ""}.`)}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Message us on WhatsApp
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        If you've already sorted this out elsewhere, no need to reply — we just didn't want to leave you waiting.
      </p>
    </div>
  `;

  await sendAndLog({
    to: params.email,
    subject: "Still need help with your quote request?",
    html,
  });
}

/** Best-effort — never throws. Same purpose as notifyQuoteRequestFollowUp,
 * for a customer whose approved Sourcing Request hasn't drawn a single
 * supplier's interest yet — the one case where the self-serve board has
 * silently failed them, since nobody on staff would otherwise notice. */
export async function notifySourcingRequestFollowUp(params: {
  customerName: string;
  customerEmail: string;
  title: string;
}): Promise<void> {
  const html = `
    <div style="font-family: Arial, Helvetica, sans-serif; max-width: 480px; margin: 0 auto; color: #0f1c17;">
      <p style="font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #059669; margin: 0 0 12px;">
        The Unique Choice
      </p>
      <h1 style="font-size: 20px; margin: 0 0 12px;">Still looking for suppliers, ${escapeHtml(params.customerName)}?</h1>
      <p style="font-size: 14px; color: #5b6b64; margin: 0 0 16px;">
        Your sourcing request "${escapeHtml(params.title)}" has been live for a few days, but no supplier has reached out
        yet. If you'd like our team to help find a match directly, just reply to this email or message us on WhatsApp.
      </p>
      <a href="${whatsappLink(`Hi! Still looking for a supplier for "${params.title}".`)}" style="display: inline-block; background: #059669; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 24px; border-radius: 999px;">
        Message us on WhatsApp
      </a>
      <p style="font-size: 12px; color: #9ca3af; margin-top: 24px;">
        If you've already found what you needed, no need to reply.
      </p>
    </div>
  `;

  await sendAndLog({
    to: params.customerEmail,
    subject: `Update on your sourcing request: ${params.title}`,
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
