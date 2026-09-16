import { MailCheck, AlertOctagon, Ban, Send } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailEvents } from "@/lib/actions/emailCampaigns";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card, EmptyState, Badge, type BadgeTone } from "@/components/admin/ui";
import type { EmailEvent } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const EVENT_META: Record<string, { label: string; tone: BadgeTone; icon: React.ComponentType<{ size?: number }> }> = {
  "email.delivered": { label: "delivered", tone: "success", icon: MailCheck },
  "email.bounced": { label: "bounced", tone: "warning", icon: AlertOctagon },
  "email.complained": { label: "spam complaint", tone: "danger", icon: Ban },
};

export default async function EmailEventsPage() {
  await requireAdminPage();
  const events = await getEmailEvents(200);

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email">Email</BackLink>
      <PageHeader
        title="Deliverability events"
        subtitle="Every delivery, bounce, and spam complaint Resend has reported back for emails sent from this account — not just campaigns, any email including shipment notices and portal sign-in links."
      />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Most recent {events.length}</p>
        </div>
        <div className="max-h-[640px] overflow-y-auto">
          {events.length === 0 && (
            <div className="p-6">
              <EmptyState icon={Send}>
                No events yet — they&apos;ll appear here once Resend&apos;s webhook is configured and starts reporting deliveries,
                bounces, and complaints.
              </EmptyState>
            </div>
          )}
          {events.map((e: EmailEvent) => {
            const meta = EVENT_META[e.type] ?? { label: e.type, tone: "neutral" as BadgeTone, icon: Send };
            const Icon = meta.icon;
            return (
              <div key={e.id} className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-2.5 text-sm last:border-b-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={14} />
                  <span className="truncate text-gray-700">{e.recipient_email ?? "Unknown recipient"}</span>
                  {e.bounce_type && <span className="shrink-0 text-xs text-gray-400">({e.bounce_type})</span>}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-xs text-gray-400">{new Date(e.created_at).toLocaleString()}</span>
                  <Badge tone={meta.tone}>{meta.label}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminShell>
  );
}
