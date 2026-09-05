import Link from "next/link";
import { LogOut } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { adminFeatures, type AdminFeature } from "@/lib/admin-features";
import { logout } from "./logout/actions";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  await requireAdminPage();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Admin panel</h1>
            <p className="mt-1 text-sm text-gray-500">The Unique Choice — internal tools</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {adminFeatures.map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>

        <p className="mt-8 text-xs text-gray-400">
          To add a new feature here, add an entry to lib/admin-features.ts.
        </p>
      </div>
    </main>
  );
}

function FeatureCard({ title, description, href, status }: AdminFeature) {
  const card = (
    <div
      className={`card-hover flex h-full flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm ${
        status === "planned" ? "opacity-70" : ""
      }`}
    >
      <div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-display text-sm font-semibold text-gray-900">{title}</h2>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              status === "live" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}
          >
            {status === "live" ? "Live" : "Planned"}
          </span>
        </div>
        <p className="mt-2 text-sm text-gray-500">{description}</p>
      </div>
    </div>
  );

  return status === "live" ? <Link href={href}>{card}</Link> : card;
}
