import { Suspense } from "react";
import Link from "next/link";
import { MessageSquareText, Truck, ClipboardCheck, DollarSign, Plus, Users, ShieldCheck, Sparkles } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getActiveQuoteCount, getWonRevenue } from "@/lib/actions/quoteRequests";
import { getShipmentKpiCounts } from "@/lib/actions/shipments";
import { getRecentActivity, type ActivityItem } from "@/lib/actions/dashboard";
import AdminShell from "@/components/admin/AdminShell";
import PurgeCacheButton from "@/components/admin/PurgeCacheButton";
import {
  PageHeader,
  Card,
  KpiCard,
  KpiCardSkeleton,
  LinkButton,
  EmptyState,
} from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

function formatMoney(value: number): string {
  if (value === 0) return "$0";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default async function AdminPage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin">
      <PageHeader title="Dashboard" subtitle="The Unique Choice — internal tools" />

      <Suspense fallback={<KpiSkeletonRow />}>
        <KpiRow />
      </Suspense>

      <div>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-400">Quick actions</h2>
        <div className="flex flex-wrap gap-2">
          <LinkButton href="/admin/shipments/new" size="sm">
            <Plus size={14} />
            New shipment
          </LinkButton>
          <LinkButton href="/admin/quote-requests" variant="secondary" size="sm">
            <MessageSquareText size={14} />
            Review quotes
          </LinkButton>
          <LinkButton href="/admin/suppliers" variant="secondary" size="sm">
            <ShieldCheck size={14} />
            Review suppliers
          </LinkButton>
          <LinkButton href="/admin/clients" variant="secondary" size="sm">
            <Users size={14} />
            View clients
          </LinkButton>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Suspense fallback={<Card className="h-96 animate-pulse" />}>
          <ActivityFeed />
        </Suspense>

        <div className="flex flex-col gap-4">
          <PurgeCacheButton />
        </div>
      </div>
    </AdminShell>
  );
}

async function KpiRow() {
  const [activeQuotes, shipmentCounts, revenue] = await Promise.all([
    getActiveQuoteCount(),
    getShipmentKpiCounts(),
    getWonRevenue(),
  ]);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard label="Active Quotes" value={String(activeQuotes)} icon={MessageSquareText} />
      <KpiCard label="Orders in Transit" value={String(shipmentCounts.inTransit)} icon={Truck} />
      <KpiCard
        label="Inspections Pending"
        value={String(shipmentCounts.inspectionsPending)}
        icon={ClipboardCheck}
        tone={shipmentCounts.inspectionsPending > 0 ? "warning" : "neutral"}
      />
      <KpiCard
        label="Revenue (won)"
        value={formatMoney(revenue)}
        icon={DollarSign}
        tone={revenue > 0 ? "success" : "neutral"}
        context={revenue === 0 ? "No quotes priced yet" : undefined}
      />
    </div>
  );
}

function KpiSkeletonRow() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
      <KpiCardSkeleton />
    </div>
  );
}

async function ActivityFeed() {
  const items = await getRecentActivity(12);

  return (
    <Card className="p-0">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-admin-display text-sm font-semibold text-gray-900">Recent activity</h2>
      </div>
      {items.length === 0 ? (
        <div className="p-5">
          <EmptyState icon={Sparkles}>Nothing yet — activity across quotes, orders, and suppliers shows up here.</EmptyState>
        </div>
      ) : (
        <div className="flex flex-col divide-y divide-gray-100">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </Card>
  );
}

const KIND_DOT: Record<ActivityItem["kind"], string> = {
  quote: "bg-blue-500",
  shipment: "bg-accent",
  supplier: "bg-emerald-500",
};

function ActivityRow({ item }: { item: ActivityItem }) {
  return (
    <Link href={item.href} className="flex items-start gap-3 px-5 py-3.5 transition hover:bg-gray-50">
      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${KIND_DOT[item.kind]}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-gray-700">{item.text}</p>
        <p className="text-xs text-gray-400">{new Date(item.at).toLocaleString()}</p>
      </div>
    </Link>
  );
}
