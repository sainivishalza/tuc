/**
 * Site analytics — pageviews and CTA clicks, stored in the database
 * (analytics_events table) so the admin dashboard sees real
 * cross-visitor traffic, not just what happened in one browser.
 * No cookies, no personal data — just event type, path, and locale.
 */

import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { locales } from "@/lib/i18n";

function localeFromPath(path: string): string | null {
  const first = path.split("/")[1];
  return (locales as readonly string[]).includes(first) ? first : null;
}

function send(event_type: "pageview" | "cta_click", path: string, cta_id?: string) {
  if (typeof window === "undefined") return;
  try {
    const supabase = getSupabasePublicClient();
    supabase
      .from("analytics_events")
      .insert({
        event_type,
        path,
        locale: localeFromPath(path),
        cta_id: cta_id ?? null,
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
