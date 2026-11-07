import { MessageCircle, TrendingUp, Package, Building2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getInquiriesSummary } from "@/lib/actions/inquiries";
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

function BarRow({ label, sublabel, count, max }: { label: string; sublabel?: string; count: number; max: number }) {
  const pct = max > 0 ? (count / max) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-48 shrink-0">
        <p className="truncate text-xs font-medium text-gray-700">{label}</p>
        {sublabel && <p className="truncate text-[11px] text-gray-400">{sublabel}</p>}
      </div>
      <div className="h-5 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div className="h-full rounded-full bg-brand-800" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-8 text-right text-xs font-semibold text-gray-900">{count}</span>
    </div>
  );
}

export default async function InquiriesAdminPage() {
  await requireAdminPage();
  const { total, last7Days, topProducts, topSuppliers, recent } = await getInquiriesSummary();

  const maxProduct = topProducts[0]?.count ?? 1;
  const maxSupplier = topSuppliers[0]?.count ?? 1;

  return (
    <AdminShell current="/admin/inquiries">
      <PageHeader
        title="Inquiries"
        subtitle={`Every "Contact" / "Inquire" click on a product or supplier page, stored in the database (last ${total} inquiries).`}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard icon={MessageCircle} label="Total Inquiries" value={total} />
        <StatCard icon={TrendingUp} label="Last 7 Days" value={last7Days} />
        <StatCard icon={Building2} label="Suppliers With Interest" value={topSuppliers.length} />
      </div>

      {topProducts.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            <Package size={14} />
            Most Inquired Products
          </h2>
          <div className="space-y-2">
            {topProducts.map((p) => (
              <BarRow key={p.entity_id} label={p.title} sublabel={p.supplier_company_name} count={p.count} max={maxProduct} />
            ))}
          </div>
        </Card>
      )}

      {topSuppliers.length > 0 && (
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            <Building2 size={14} />
            Most Inquired Suppliers
          </h2>
          <div className="space-y-2">
            {topSuppliers.map((s) => (
              <BarRow key={s.supplier_id} label={s.company_name} count={s.count} max={maxSupplier} />
            ))}
          </div>
        </Card>
      )}

      {recent.length > 0 && (
        <Card>
          <h2 className="mb-4 font-admin-display text-sm font-semibold uppercase tracking-wider text-gray-500">
            Recent Inquiries (last 20)
          </h2>
          <div className="space-y-1">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs">
                <Badge tone={r.entity_type === "product" ? "success" : "info"}>{r.entity_type}</Badge>
                <span className="truncate text-gray-600">
                  {r.entity_type === "product" ? r.product_title ?? "Untitled product" : r.supplier_company_name}
                  {r.entity_type === "product" ? ` — ${r.supplier_company_name}` : ""}
                </span>
                <span className="ml-auto shrink-0 text-gray-400">{new Date(r.created_at).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {total === 0 && (
        <EmptyState>
          <MessageCircle size={28} className="mx-auto mb-3 text-gray-300" />
          No inquiries yet. Clicks on a product or supplier&apos;s &quot;Contact&quot; button will appear here.
        </EmptyState>
      )}
    </AdminShell>
  );
}
