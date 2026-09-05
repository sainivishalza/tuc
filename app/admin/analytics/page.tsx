import Link from "next/link";
import { ArrowLeft, Eye, MousePointerClick, BarChart3 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAnalyticsSummary } from "@/lib/actions/analytics";

export const metadata = {
  robots: { index: false, follow: false },
};

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
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-display text-xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-xs text-gray-500">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gray-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-900">{count}</span>
    </div>
  );
}

export default async function AnalyticsAdminPage() {
  await requireAdminPage();
  const { total, pageViews, ctaClicks, recentEvents } = await getAnalyticsSummary();

  const topPages = Object.entries(pageViews).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topCtas = Object.entries(ctaClicks).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPage = topPages[0]?.[1] ?? 1;
  const maxCta = topCtas[0]?.[1] ?? 1;
  const totalPageViews = Object.values(pageViews).reduce((a, b) => a + b, 0);
  const totalCtaClicks = Object.values(ctaClicks).reduce((a, b) => a + b, 0);

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Site Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Real pageviews and CTA clicks from all visitors, stored in the database (last {total} events).
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={Eye} label="Total Page Views" value={totalPageViews} />
          <StatCard icon={BarChart3} label="Unique Paths" value={Object.keys(pageViews).length} />
          <StatCard icon={MousePointerClick} label="CTA Clicks" value={totalCtaClicks} />
        </div>

        {topPages.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              Page Views
            </h2>
            <div className="space-y-2">
              {topPages.map(([path, count]) => (
                <BarRow key={path} label={path} count={count} max={maxPage} />
              ))}
            </div>
          </div>
        )}

        {topCtas.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              CTA Clicks
            </h2>
            <div className="space-y-2">
              {topCtas.map(([label, count]) => (
                <BarRow key={label} label={label} count={count} max={maxCta} />
              ))}
            </div>
          </div>
        )}

        {recentEvents.length > 0 && (
          <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 font-display text-sm font-semibold uppercase tracking-wider text-gray-500">
              Recent Events (last 20)
            </h2>
            <div className="space-y-1">
              {recentEvents.map((e) => (
                <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs">
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-bold uppercase ${
                      e.event_type === "pageview"
                        ? "bg-blue-100 text-blue-600"
                        : "bg-emerald-100 text-emerald-600"
                    }`}
                  >
                    {e.event_type === "pageview" ? "view" : "click"}
                  </span>
                  <span className="truncate text-gray-600">
                    {e.path}
                    {e.cta_id ? ` → ${e.cta_id}` : ""}
                  </span>
                  <span className="ml-auto shrink-0 text-gray-400">
                    {new Date(e.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {total === 0 && (
          <div className="mt-6 flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-white px-6 py-12 text-center">
            <BarChart3 size={28} className="text-gray-300" />
            <p className="text-sm text-gray-500">
              No data yet. Visits and CTA clicks across the site will appear here.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
