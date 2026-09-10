import { requireAdminPage } from "@/lib/adminAuth";
import { getNewsletterSubscribers } from "@/lib/actions/newsletter";
import type { NewsletterSubscriber } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const sourceTones: Record<NewsletterSubscriber["source"], BadgeTone> = {
  newsletter: "info",
  guide_download: "success",
};

const sourceLabels: Record<NewsletterSubscriber["source"], string> = {
  newsletter: "Newsletter",
  guide_download: "Guide download",
};

export default async function NewsletterAdminPage() {
  await requireAdminPage();
  const subscribers = await getNewsletterSubscribers();

  return (
    <AdminShell current="/admin/newsletter">
      <PageHeader
        title="Newsletter & Guide Leads"
        subtitle={`${subscribers.length} email${subscribers.length === 1 ? "" : "s"} captured from the footer signup and guide download.`}
      />

      <div className="flex flex-col gap-2">
        {subscribers.length === 0 && <EmptyState>No subscribers yet.</EmptyState>}

        {subscribers.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="font-admin-display text-sm font-semibold text-gray-900">{s.email}</p>
              <p className="text-xs text-gray-400">
                {s.locale} · {new Date(s.created_at).toLocaleDateString()}
              </p>
            </div>
            <Badge tone={sourceTones[s.source]}>{sourceLabels[s.source]}</Badge>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
