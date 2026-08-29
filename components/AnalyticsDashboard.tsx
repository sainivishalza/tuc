"use client";

import { useState, useEffect } from "react";
import {
  getPageViewCounts,
  getCtaClickCounts,
  getTotalEvents,
  clearAnalytics,
  getEvents,
  type AnalyticsEvent,
} from "@/lib/analytics";
import { Eye, MousePointerClick, Trash2, BarChart3 } from "lucide-react";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass-strong flex items-center gap-4 rounded-2xl p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-display text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-xs text-muted">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
        <div
          className="h-full rounded-full bg-accent/60 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold">{count}</span>
    </div>
  );
}

export default function AnalyticsDashboard() {
  const [pageViews, setPageViews] = useState<Record<string, number>>({});
  const [ctaClicks, setCtaClicks] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [recentEvents, setRecentEvents] = useState<AnalyticsEvent[]>([]);

  function refresh() {
    setPageViews(getPageViewCounts());
    setCtaClicks(getCtaClickCounts());
    setTotal(getTotalEvents());
    setRecentEvents(getEvents().slice(-20).reverse());
  }

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 2000);
    return () => clearInterval(id);
  }, []);

  const topPages = Object.entries(pageViews)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topCtas = Object.entries(ctaClicks)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const maxPage = topPages[0]?.[1] ?? 1;
  const maxCta = topCtas[0]?.[1] ?? 1;

  return (
    <div className="mt-8 space-y-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Eye} label="Total Page Views" value={total} />
        <StatCard icon={BarChart3} label="Unique Paths" value={Object.keys(pageViews).length} />
        <StatCard icon={MousePointerClick} label="CTA Clicks" value={Object.values(ctaClicks).reduce((a, b) => a + b, 0)} />
      </div>

      {/* Page Views */}
      {topPages.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted">
            Page Views
          </h2>
          <div className="space-y-2">
            {topPages.map(([path, count]) => (
              <BarRow key={path} label={path} count={count} max={maxPage} />
            ))}
          </div>
        </div>
      )}

      {/* CTA Clicks */}
      {topCtas.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted">
            CTA Clicks
          </h2>
          <div className="space-y-2">
            {topCtas.map(([label, count]) => (
              <BarRow key={label} label={label} count={count} max={maxCta} />
            ))}
          </div>
        </div>
      )}

      {/* Recent Events */}
      {recentEvents.length > 0 && (
        <div className="glass-strong rounded-2xl p-6">
          <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-muted">
            Recent Events (last 20)
          </h2>
          <div className="space-y-1">
            {recentEvents.map((e, i) => (
              <div
                key={i}
                className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs"
              >
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 font-bold uppercase ${
                    e.type === "pageview"
                      ? "bg-blue-500/15 text-blue-400"
                      : "bg-green-500/15 text-green-400"
                  }`}
                >
                  {e.type === "pageview" ? "view" : "click"}
                </span>
                <span className="truncate text-muted">
                  {e.path}
                  {e.label ? ` → ${e.label}` : ""}
                </span>
                <span className="ml-auto shrink-0 text-muted/60">
                  {new Date(e.ts).toLocaleTimeString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {topPages.length === 0 && topCtas.length === 0 && (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
          <BarChart3 size={28} className="text-accent/40" />
          <p className="text-sm text-muted">
            No data yet. Browse the site and click CTAs to see analytics appear
            here.
          </p>
        </div>
      )}

      {/* Clear Button */}
      {total > 0 && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              clearAnalytics();
              refresh();
            }}
            className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-xs text-muted transition hover:border-red-500/50 hover:text-red-400"
          >
            <Trash2 size={14} />
            Clear Data
          </button>
        </div>
      )}
    </div>
  );
}
