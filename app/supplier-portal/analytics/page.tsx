import Link from "next/link";
import { ArrowLeft, Eye, TrendingUp, MessageCircle, Package } from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierBySelf } from "@/lib/actions/supplierPortal";
import { getSupplierInquiriesSummary } from "@/lib/actions/inquiries";

export const metadata = {
  robots: { index: false, follow: false },
};

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ size?: number }>;
  label: string;
  value: number | string;
}) {
  return (
    <div className="glass-strong card flex items-center gap-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
        <Icon size={20} />
      </span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="font-display text-xl font-bold">{value}</p>
      </div>
    </div>
  );
}

export default async function SupplierAnalyticsPage() {
  const email = await requireSupplierEmail();
  const supplier = await getSupplierBySelf(email);

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted">We couldn&apos;t find a supplier account for {email}.</p>
      </main>
    );
  }

  const summary = await getSupplierInquiriesSummary(supplier.id);
  const maxProduct = summary.topProducts[0]?.count ?? 1;

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link href="/supplier-portal" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft size={14} />
          Back to your account
        </Link>

        <p className="eyebrow eyebrow-ruled accent-text text-sm">Your Analytics</p>
        <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">How buyers are finding you</h1>
        <p className="mt-2 text-sm text-muted">
          Every time someone clicks &quot;Contact&quot; on your profile or one of your products, it shows up here —
          nobody else&apos;s data, just yours.
        </p>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard icon={MessageCircle} label="Total Inquiries" value={summary.total} />
          <StatCard icon={TrendingUp} label="Last 7 Days" value={summary.last7Days} />
          <StatCard icon={Eye} label="Profile Inquiries" value={summary.profileInquiries} />
        </div>

        <div className="glass-strong card mt-6">
          <h2 className="font-display flex items-center gap-2 text-base font-semibold">
            <Package size={16} />
            Your Most-Inquired Products
          </h2>
          {summary.topProducts.length === 0 ? (
            <p className="mt-3 text-sm text-muted">
              No product inquiries yet.{" "}
              <Link href="/supplier-portal/products" className="text-accent hover:underline">
                List a product
              </Link>{" "}
              to start showing up in the catalog.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {summary.topProducts.map((p) => {
                const pct = maxProduct > 0 ? (p.count / maxProduct) * 100 : 0;
                return (
                  <div key={p.entity_id} className="flex items-center gap-3">
                    <span className="w-40 shrink-0 truncate text-xs text-muted">{p.title}</span>
                    <div className="h-5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-right text-xs font-semibold">{p.count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
