"use server";

import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { CronRun } from "@/lib/supabase/types";

/** How long is "too long" before a cron job's silence is worth flagging —
 * digest/follow-ups ride a once-a-day Hostinger Cron Job (some slack for
 * a cron that fires at a slightly different time each day); the campaign
 * sender is meant to fire every ~15 minutes, so even a couple of hours of
 * silence means it's likely stopped. Both are external schedulers this
 * app has zero control over once they're set up in hPanel — this is
 * purely "is the thing that's supposed to call us still calling us." */
const EXPECTED_INTERVAL_MS: Record<string, number> = {
  digest: 26 * 60 * 60 * 1000,
  "send-scheduled-campaigns": 2 * 60 * 60 * 1000,
};
const KNOWN_CRON_NAMES = Object.keys(EXPECTED_INTERVAL_MS);

export interface CronRunStatus {
  name: string;
  lastRunAt: string | null;
  lastOk: boolean | null;
  lastError: string | null;
  stale: boolean;
}

/** Reports every known cron job, including ones that have NEVER fired
 * (no row at all yet) as stale — a cron that was never configured is
 * exactly as actionable as one that stopped. */
export async function getCronRunsStatus(): Promise<CronRunStatus[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("cron_runs").select("*").in("name", KNOWN_CRON_NAMES);
  const byName = new Map((data ?? []).map((r) => [r.name as string, r as CronRun]));

  return KNOWN_CRON_NAMES.map((name) => {
    const run = byName.get(name);
    const expectedMs = EXPECTED_INTERVAL_MS[name];
    const stale = !run || Date.now() - new Date(run.last_run_at).getTime() > expectedMs || !run.last_ok;
    return {
      name,
      lastRunAt: run?.last_run_at ?? null,
      lastOk: run?.last_ok ?? null,
      lastError: run?.last_error ?? null,
      stale,
    };
  });
}

export interface IntegrationStatus {
  name: string;
  configured: boolean;
  detail: string;
}

/** Every integration on this site "gracefully degrades" when its env var
 * isn't set — the form still submits, the page still renders, nothing
 * throws. That's the right behavior for a single missing optional
 * feature, but it also means a genuinely unconfigured integration looks
 * identical to a correctly-configured one from the outside: nobody finds
 * out until a customer asks why they never got a reply, or an admin
 * notices translations never showed up. This just reads the same
 * environment variables and settings each integration already checks
 * for itself, in one place, so that silence is visible instead of
 * invisible — same reasoning as the cron_runs health check above. */
export async function getIntegrationsStatus(): Promise<IntegrationStatus[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: settings } = await supabase
    .from("platform_settings")
    .select("ai_provider, ai_api_key, ai_model")
    .eq("id", "default")
    .maybeSingle();

  // Mirrors the exact provider/field combinations translateSourcingRequest
  // itself treats as configured (lib/translateText.ts) — openai_compatible
  // needs a model name too, not just a key.
  const aiConfigured =
    (settings?.ai_provider === "anthropic" && !!settings?.ai_api_key) ||
    (settings?.ai_provider === "openai_compatible" && !!settings?.ai_api_key && !!settings?.ai_model) ||
    !!process.env.ANTHROPIC_API_KEY;

  return [
    {
      name: "Email sending (Resend)",
      configured: !!process.env.RESEND_API_KEY && !!process.env.RESEND_FROM_EMAIL,
      detail: "Every notification, campaign, and invoice email on the site goes through this.",
    },
    {
      name: "New-lead notifications",
      configured: !!process.env.LEAD_NOTIFICATION_EMAIL,
      detail: "Where staff actually hear about a new quote, sourcing request, supplier registration, or review.",
    },
    {
      name: "AI translation (zh/ru)",
      configured: aiConfigured,
      detail: "Sourcing requests post in English only without this — no error, just no translation.",
    },
    {
      name: "Spam protection (Turnstile)",
      configured: !!process.env.TURNSTILE_SECRET_KEY,
      detail: "Public forms (quotes, reviews, registrations) accept submissions with no bot-check without this.",
    },
    {
      name: "Carrier tracking sync (DHL)",
      configured: !!process.env.DHL_API_KEY,
      detail: "Shipment status has to be updated by hand instead of syncing automatically without this.",
    },
    {
      name: "CDN cache purge (Hostinger)",
      configured: !!process.env.HOSTINGER_API_TOKEN,
      detail: "The \"Purge CDN cache\" button below will fail when clicked without this.",
    },
  ];
}

export interface ActivityItem {
  id: string;
  kind: "quote" | "shipment" | "supplier";
  text: string;
  at: string;
  href: string;
}

const SHIPMENT_STATUS_LABEL: Record<string, string> = {
  not_shipped: "order placed",
  in_production: "moved to production",
  quality_check: "reached quality check",
  ready_to_ship: "marked ready to ship",
  in_transit: "shipped",
  delayed: "flagged as delayed",
  delivered: "delivered",
  exception: "flagged an exception",
};

/**
 * A real reverse-chronological feed built from the three tables that
 * already track their own timestamps — quote_requests.created_at,
 * shipments.updated_at, suppliers.created_at — rather than a dedicated
 * activity log table that doesn't exist. Each row becomes one line;
 * merging and re-sorting the three short lists client-side (well within
 * a single request) is simpler and cheaper than a union query for N=30.
 */
export async function getRecentActivity(limit = 12): Promise<ActivityItem[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const [quotes, shipments, suppliers] = await Promise.all([
    supabase
      .from("quote_requests")
      .select("id, name, product, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
    supabase
      .from("shipments")
      .select("id, tracking_number, status, updated_at")
      .order("updated_at", { ascending: false })
      .limit(limit),
    supabase
      .from("suppliers")
      .select("id, company_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit),
  ]);

  const items: ActivityItem[] = [];

  for (const q of quotes.data ?? []) {
    items.push({
      id: `quote-${q.id}`,
      kind: "quote",
      text: `New quote request from ${q.name}${q.product ? ` — ${q.product}` : ""}`,
      at: q.created_at,
      href: "/admin/quote-requests",
    });
  }
  for (const s of shipments.data ?? []) {
    const label = SHIPMENT_STATUS_LABEL[s.status] ?? s.status;
    items.push({
      id: `shipment-${s.id}`,
      kind: "shipment",
      text: `Shipment ${s.tracking_number} ${label}`,
      at: s.updated_at,
      href: `/admin/shipments/${s.id}`,
    });
  }
  for (const sup of suppliers.data ?? []) {
    items.push({
      id: `supplier-${sup.id}`,
      kind: "supplier",
      text: `${sup.company_name} registered as a supplier`,
      at: sup.created_at,
      href: "/admin/suppliers",
    });
  }

  return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime()).slice(0, limit);
}
