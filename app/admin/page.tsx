import Link from "next/link";
import { requireAdminPage } from "@/lib/adminAuth";
import { adminFeatures, type AdminFeature } from "@/lib/admin-features";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Badge } from "@/components/admin/ui";
import PurgeCacheButton from "@/components/admin/PurgeCacheButton";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin">
      <PageHeader title="Admin panel" subtitle="The Unique Choice — internal tools" />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {adminFeatures.map((f) => (
          <FeatureCard key={f.title} {...f} />
        ))}
      </div>

      <PurgeCacheButton />

      <p className="text-xs text-gray-400">
        To add a new feature here, add an entry to lib/admin-features.ts.
      </p>
    </AdminShell>
  );
}

function FeatureCard({ title, description, href, status, icon: Icon }: AdminFeature) {
  const card = (
    <div
      className={`card-hover flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
        status === "planned" ? "opacity-70" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-50 text-brand-900">
          <Icon size={17} />
        </span>
        <Badge tone={status === "live" ? "success" : "neutral"}>
          {status === "live" ? "Live" : "Planned"}
        </Badge>
      </div>
      <div>
        <h2 className="font-display text-sm font-semibold text-gray-900">{title}</h2>
        <p className="mt-1.5 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );

  return status === "live" ? <Link href={href}>{card}</Link> : card;
}
