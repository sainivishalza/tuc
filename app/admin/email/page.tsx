import Link from "next/link";
import { Plus, FileText, UserPlus, Activity, MailCheck, AlertOctagon, Ban } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailCampaigns, getEmailSendSettings, getDeliverabilityStats } from "@/lib/actions/emailCampaigns";
import EmailSendSettingsForm from "@/components/admin/EmailSendSettingsForm";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, KpiCard, type BadgeTone } from "@/components/admin/ui";
import type { EmailCampaign } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<EmailCampaign["status"], BadgeTone> = {
  draft: "neutral",
  sending: "info",
  paused: "warning",
  completed: "success",
};

export default async function EmailAdminPage() {
  await requireAdminPage();
  const [campaigns, settings, deliverability] = await Promise.all([
    getEmailCampaigns(),
    getEmailSendSettings(),
    getDeliverabilityStats(),
  ]);
  const isPaused = !!settings.paused_until && new Date(settings.paused_until) > new Date();

  return (
    <AdminShell current="/admin/email">
      <PageHeader
        title="Email Sender"
        subtitle="Send templated campaigns to clients, suppliers, newsletter subscribers, and prospects you're inviting to join — with built-in deliverability safeguards."
        action={
          <div className="flex flex-wrap gap-2">
            <LinkButton href="/admin/email/prospects" variant="secondary">
              <UserPlus size={15} />
              Prospects
            </LinkButton>
            <LinkButton href="/admin/email/templates" variant="secondary">
              <FileText size={15} />
              Templates
            </LinkButton>
            <LinkButton href="/admin/email/events" variant="secondary">
              <Activity size={15} />
              Events
            </LinkButton>
            <LinkButton href="/admin/email/campaigns/new">
              <Plus size={15} />
              New campaign
            </LinkButton>
          </div>
        }
      />

      <div>
        <p className="mb-3 font-admin-display text-sm font-semibold text-gray-900">Deliverability (last 30 days)</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KpiCard label="Delivered" value={deliverability.delivered.toLocaleString()} icon={MailCheck} tone="success" />
          <KpiCard
            label="Bounced"
            value={deliverability.bounced.toLocaleString()}
            icon={AlertOctagon}
            tone={deliverability.bounced > 0 ? "warning" : "neutral"}
          />
          <KpiCard
            label="Spam complaints"
            value={deliverability.complained.toLocaleString()}
            icon={Ban}
            tone={deliverability.complained > 0 ? "danger" : "neutral"}
          />
        </div>
      </div>

      <Card>
        <p className="mb-1 font-admin-display text-sm font-semibold text-gray-900">Sending Limits & Safety</p>
        <p className="mb-4 text-xs text-gray-500">
          These caps protect your domain&apos;s reputation — Gmail and Yahoo throttle or spam-box senders whose volume or failure
          rate looks abnormal, so it&apos;s better to send in controlled batches than all at once.
        </p>
        <EmailSendSettingsForm settings={settings} isPaused={isPaused} />
      </Card>

      <div>
        <p className="mb-3 font-admin-display text-sm font-semibold text-gray-900">Campaigns</p>
        <div className="flex flex-col gap-3">
          {campaigns.length === 0 && <EmptyState>No campaigns yet — create a template, then a campaign.</EmptyState>}
          {campaigns.map((c) => (
            <Link key={c.id} href={`/admin/email/campaigns/${c.id}`}>
              <Card className="flex items-center justify-between gap-4 transition hover:border-gray-300">
                <div className="min-w-0">
                  <p className="truncate font-admin-display text-sm font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">
                    {c.sent_count} sent · {c.failed_count} failed · {c.total_recipients} total
                  </p>
                </div>
                <Badge tone={statusTones[c.status]}>{c.status}</Badge>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
