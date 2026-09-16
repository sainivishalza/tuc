// Renders an EmailTemplate + a recipient's unsubscribe link into the
// actual HTML/text sent by a campaign. Deliverability choices are made
// once, here, rather than left to whoever edits a template:
//
// - Single-column, max 600px, inline CSS only (Gmail strips <style>
//   blocks in many clients, so anything that matters has to be inline).
// - A hidden preheader span, so the inbox preview snippet is the
//   template's own preheader instead of a stray "view in browser" line.
// - A visible unsubscribe link AND a physical/organization identifier in
//   the footer — the CAN-SPAM baseline, and also just what keeps a
//   legitimate sender's complaint rate low, which is the single biggest
//   lever on inbox-vs-spam placement.
// - A matching plain-text part is always generated (see toPlainText) —
//   multipart mail reads as far less spammy than HTML-only.

const ORG_NAME = "The Unique Choice";
const ORG_FOOTER_LINE = "The Unique Choice — China & Hong Kong sourcing";

export interface RenderableTemplate {
  subject: string;
  preheader: string | null;
  headline: string;
  body_text: string;
  cta_text: string | null;
  cta_url: string | null;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function paragraphsHtml(bodyText: string): string {
  return bodyText
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #333333;">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("\n");
}

export function renderCampaignEmailHtml(template: RenderableTemplate, unsubscribeUrl: string | null): string {
  const preheader = template.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all;">${escapeHtml(template.preheader)}</div>`
    : "";

  const cta =
    template.cta_text && template.cta_url
      ? `<div style="margin: 24px 0;">
          <a href="${escapeHtml(template.cta_url)}" style="display: inline-block; background: #c1791e; color: #ffffff; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 999px;">
            ${escapeHtml(template.cta_text)}
          </a>
        </div>`
      : "";

  const unsubscribeLine = unsubscribeUrl
    ? `<a href="${escapeHtml(unsubscribeUrl)}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>`
    : "";

  return `
    ${preheader}
    <div style="background: #f4f5f7; padding: 32px 16px; font-family: Arial, Helvetica, sans-serif;">
      <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden;">
        <div style="padding: 32px 32px 8px;">
          <p style="margin: 0 0 20px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: #059669;">
            ${escapeHtml(ORG_NAME)}
          </p>
          <h1 style="margin: 0 0 16px; font-size: 21px; line-height: 1.3; color: #0f1c17;">${escapeHtml(template.headline)}</h1>
          ${paragraphsHtml(template.body_text)}
          ${cta}
        </div>
        <div style="padding: 20px 32px; border-top: 1px solid #eef0f2;">
          <p style="margin: 0; font-size: 12px; line-height: 1.6; color: #9ca3af;">
            ${escapeHtml(ORG_FOOTER_LINE)}
            ${unsubscribeLine ? ` · ${unsubscribeLine}` : ""}
          </p>
        </div>
      </div>
    </div>
  `;
}

export function renderCampaignEmailText(template: RenderableTemplate, unsubscribeUrl: string | null): string {
  const paragraphs = template.body_text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .join("\n\n");

  const cta = template.cta_text && template.cta_url ? `\n\n${template.cta_text}: ${template.cta_url}` : "";
  const footer = unsubscribeUrl
    ? `\n\n---\n${ORG_FOOTER_LINE}\nUnsubscribe: ${unsubscribeUrl}`
    : `\n\n---\n${ORG_FOOTER_LINE}`;

  return `${template.headline}\n\n${paragraphs}${cta}${footer}`;
}

// A soft warning, not a hard block — surfaced in the template editor so
// an admin can reconsider wording before it burns inbox reputation, not
// a filter that silently rewrites what they wrote.
const SPAM_TRIGGER_WORDS = [
  "free money",
  "act now",
  "limited time only",
  "click here",
  "buy now",
  "100% free",
  "guaranteed",
  "no obligation",
  "risk-free",
  "cash bonus",
  "congratulations",
  "winner",
  "!!!",
];

export function findSpamTriggerWords(text: string): string[] {
  const lower = text.toLowerCase();
  return SPAM_TRIGGER_WORDS.filter((w) => lower.includes(w));
}
