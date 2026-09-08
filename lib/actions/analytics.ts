"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { classifySource } from "@/lib/trafficSource";
import type { AnalyticsEvent } from "@/lib/supabase/types";

const MAX_EVENTS = 5000;

export interface AnalyticsSummary {
  total: number;
  pageViews: Record<string, number>;
  ctaClicks: Record<string, number>;
  sources: Record<string, number>;
  uniqueSessions: number;
  organicSessions: number;
  recentEvents: AnalyticsEvent[];
}

export async function getAnalyticsSummary(): Promise<AnalyticsSummary> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("analytics_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(MAX_EVENTS);

  if (error || !data) {
    return { total: 0, pageViews: {}, ctaClicks: {}, sources: {}, uniqueSessions: 0, organicSessions: 0, recentEvents: [] };
  }

  const events = data as AnalyticsEvent[];
  const pageViews: Record<string, number> = {};
  const ctaClicks: Record<string, number> = {};

  // One source per session (the first event carries that session's
  // referrer/UTM — later events in the same tab reuse it), not per
  // pageview, so a 5-page visit counts once toward its source.
  const sessionSources = new Map<string, string>();

  for (const e of events) {
    if (e.event_type === "pageview") {
      pageViews[e.path] = (pageViews[e.path] ?? 0) + 1;
    } else if (e.event_type === "cta_click" && e.cta_id) {
      ctaClicks[e.cta_id] = (ctaClicks[e.cta_id] ?? 0) + 1;
    }

    const key = e.session_id ?? `no-session-${e.id}`;
    if (!sessionSources.has(key)) {
      sessionSources.set(key, classifySource(e.referrer, e.utm_source));
    }
  }

  const sources: Record<string, number> = {};
  for (const source of sessionSources.values()) {
    sources[source] = (sources[source] ?? 0) + 1;
  }

  const organicSessions = sources["Organic Search"] ?? 0;

  return {
    total: events.length,
    pageViews,
    ctaClicks,
    sources,
    uniqueSessions: sessionSources.size,
    organicSessions,
    recentEvents: events.slice(0, 20),
  };
}
