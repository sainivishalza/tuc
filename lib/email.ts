import "server-only";

export interface SendEmailResult {
  ok: boolean;
  message: string;
}

/** Thin wrapper over Resend's REST API — no SDK dependency, matching how
 * this codebase talks to DHL. Never throws: email is a best-effort side
 * effect of admin actions and customer lookups, not something that should
 * ever block or break the action that triggered it. */
export async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
  /** Plain-text alternative part. Optional for one-off transactional
   * sends, but real deliverability weight for bulk mail — a multipart
   * (html + text) message reads as far less spammy to Gmail/Yahoo than
   * HTML-only. See lib/emailTemplateRenderer.ts, which always supplies one. */
  text?: string;
  /** Raw header overrides — used by campaign sends to set List-Unsubscribe
   * / List-Unsubscribe-Post, which Gmail and Yahoo's 2024 bulk-sender
   * rules effectively require for mail to land in the inbox rather than
   * spam. Left undefined for ordinary transactional sends. */
  headers?: Record<string, string>;
}): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey || !from) {
    return { ok: false, message: "Email isn't configured yet (missing RESEND_API_KEY or RESEND_FROM_EMAIL)." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: params.to,
        subject: params.subject,
        html: params.html,
        ...(params.text ? { text: params.text } : {}),
        ...(params.headers ? { headers: params.headers } : {}),
      }),
      // A hung Resend call must never hold up the server action that
      // triggered it (a customer submitting a form, an admin saving a
      // status change) — cap it well under any reasonable request timeout.
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => res.statusText);
      return { ok: false, message: `Email API error (${res.status}): ${body}` };
    }

    return { ok: true, message: "Sent." };
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to send email." };
  }
}
