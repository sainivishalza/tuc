/**
 * Site analytics — pageviews and CTA clicks, stored in the database
 * (analytics_events table) so the admin dashboard sees real
 * cross-visitor traffic, not just what happened in one browser.
 * No cookies, no personal data — just event type, path, locale, and
 * how the visitor's session arrived (referrer / UTM params), captured
 * once per tab and reused for every event in that session so
 * attribution survives client-side navigation.
 */

import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { locales } from "@/lib/i18n";

const SESSION_KEY = "tuc_session";

interface SessionAttribution {
  sessionId: string;
  referrer: string;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
}

function readOrCreateSession(): SessionAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.sessionStorage.getItem(SESSION_KEY);
    if (existing) return JSON.parse(existing) as SessionAttribution;

    const params = new URLSearchParams(window.location.search);
    const session: SessionAttribution = {
      sessionId: crypto.randomUUID(),
      referrer: document.referrer || "",
      utmSource: params.get("utm_source"),
      utmMedium: params.get("utm_medium"),
      utmCampaign: params.get("utm_campaign"),
    };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  } catch {
    return null;
  }
}

function localeFromPath(path: string): string | null {
  const first = path.split("/")[1];
  return (locales as readonly string[]).includes(first) ? first : null;
}

function send(event_type: "pageview" | "cta_click", path: string, cta_id?: string) {
  if (typeof window === "undefined") return;
  try {
    const session = readOrCreateSession();
    const supabase = getSupabasePublicClient();
    supabase
      .from("analytics_events")
      .insert({
        event_type,
        path,
        locale: localeFromPath(path),
        cta_id: cta_id ?? null,
        session_id: session?.sessionId ?? null,
        referrer: session?.referrer || null,
        utm_source: session?.utmSource ?? null,
        utm_medium: session?.utmMedium ?? null,
        utm_campaign: session?.utmCampaign ?? null,
      })
      .then(() => {});
  } catch {
    // Analytics must never break the site.
  }
}

export function trackPageView(path: string) {
  send("pageview", path);
}

export function trackCtaClick(label: string, path: string) {
  send("cta_click", path, label);
}

/** Logs a click on a product/supplier "inquire" button into its own
 * `inquiries` table — unlike trackCtaClick (a static label, counted
 * site-wide), this records which specific product or supplier the
 * visitor was interested in, so the admin can see what's actually
 * getting traction. Same fire-and-forget, never-throws shape as send(). */
export function trackInquiry(params: {
  entityType: "product" | "supplier";
  entityId: string;
  supplierId: string;
  supplierCompanyName: string;
  productTitle?: string | null;
  path: string;
}) {
  if (typeof window === "undefined") return;
  try {
    const session = readOrCreateSession();
    const supabase = getSupabasePublicClient();
    supabase
      .from("inquiries")
      .insert({
        entity_type: params.entityType,
        entity_id: params.entityId,
        supplier_id: params.supplierId,
        supplier_company_name: params.supplierCompanyName,
        product_title: params.productTitle ?? null,
        channel: "whatsapp",
        locale: localeFromPath(params.path),
        path: params.path,
        session_id: session?.sessionId ?? null,
      })
      .then(() => {});
  } catch {
    // Inquiry tracking must never break the inquire action itself.
  }
}
