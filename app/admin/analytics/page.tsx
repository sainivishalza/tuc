import { Eye, MousePointerClick, BarChart3, Users, Compass } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAnalyticsSummary } from "@/lib/actions/analytics";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge } from "@/components/admin/ui";

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
    <Card className="flex items-center gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-900">
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="font-admin-display text-xl font-bold text-gray-900">{value}</p>
      </div>
    </Card>
  );
}

function BarRow({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-xs text-gray-500">{label}</span>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-800" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-900">{count}</span>
    </div>
  );
}

export default async function AnalyticsAdminPage() {
  await requireAdminPage();
  const { total, pageViews, ctaClicks, sources, uniqueSessions, organicSessions, recentEvents } =
    await getAnalyticsSummary();

  const topPages = Object.entries(pageViews).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topCtas = Object.entries(ctaClicks).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const topSources = Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const maxPage = topPages[0]?.[1] ?? 1;
  const maxCta = topCtas[0]?.[1] ?? 1;
  const maxSource = topSources[0]?.[1] ?? 1;
  const totalPageViews = Object.values(pageViews).reduce((a, b) => a + b, 0);
  const totalCtaClicks = Object.values(ctaClicks).reduce((a, b) => a + b, 0);

  return (
    <AdminShell current="/admin/analytics">
      <PageHeader
        title="Site Analytics"
        subtitle={`Real pageviews and CTA clicks from all visitors, stored in the database (last ${total} events).`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={Users} label="Visitor Sessions" value={uniqueSessions} />
        <StatCard icon={Compass} label="From Organic Search" value={organicSessions} />
        <StatCard icon={Eye} label="Total Page Views" value={totalPageViews} />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={BarChart3} label="Unique Paths" value={Object.keys(pageViews).length} />
        <StatCard icon={MousePointerClick} label="CTA Clicks" value={totalCtaClicks} />
      </div>

      {topSources.length > 0 && (
        <Card>
          <h2 className="mb-4 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            Traffic Sources (by visitor session)
          </h2>
          <div className="space-y-2">
            {topSources.map(([source, count]) => (
              <BarRow key={source} label={source} count={count} max={maxSource} />
            ))}
          </div>
        </Card>
      )}

      {topPages.length > 0 && (
        <Card>
          <h2 className="mb-4 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            Page Views
          </h2>
          <div className="space-y-2">
            {topPages.map(([path, count]) => (
              <BarRow key={path} label={path} count={count} max={maxPage} />
            ))}
          </div>
        </Card>
      )}

      {topCtas.length > 0 && (
        <Card>
          <h2 className="mb-4 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            CTA Clicks
          </h2>
          <div className="space-y-2">
            {topCtas.map(([label, count]) => (
              <BarRow key={label} label={label} count={count} max={maxCta} />
            ))}
          </div>
        </Card>
      )}

      {recentEvents.length > 0 && (
        <Card>
          <h2 className="mb-4 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            Recent Events (last 20)
          </h2>
          <div className="space-y-1">
            {recentEvents.map((e) => (
              <div key={e.id} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs">
                <Badge tone={e.event_type === "pageview" ? "info" : "success"}>
                  {e.event_type === "pageview" ? "view" : "click"}
                </Badge>
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
        </Card>
      )}

      {total === 0 && (
        <EmptyState>
          <BarChart3 size={28} className="mx-auto mb-3 text-gray-300" />
          No data yet. Visits and CTA clicks across the site will appear here.
        </EmptyState>
      )}
    </AdminShell>
  );
}
