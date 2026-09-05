"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { AnalyticsEvent } from "@/lib/supabase/types";

const MAX_EVENTS = 5000;

export interface AnalyticsSummary {
  total: number;
  pageViews: Record<string, number>;
  ctaClicks: Record<string, number>;
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
    return { total: 0, pageViews: {}, ctaClicks: {}, recentEvents: [] };
  }

  const events = data as AnalyticsEvent[];
  const pageViews: Record<string, number> = {};
  const ctaClicks: Record<string, number> = {};

  for (const e of events) {
    if (e.event_type === "pageview") {
      pageViews[e.path] = (pageViews[e.path] ?? 0) + 1;
    } else if (e.event_type === "cta_click" && e.cta_id) {
      ctaClicks[e.cta_id] = (ctaClicks[e.cta_id] ?? 0) + 1;
    }
  }

  return {
    total: events.length,
    pageViews,
    ctaClicks,
    recentEvents: events.slice(0, 20),
  };
}
