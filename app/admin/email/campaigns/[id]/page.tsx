import { notFound } from "next/navigation";
import { CheckCircle2, XCircle, Clock, AlertOctagon, Ban } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailCampaignById, getEmailSendSettings } from "@/lib/actions/emailCampaigns";
import CampaignSendPanel from "@/components/admin/CampaignSendPanel";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card, Badge, type BadgeTone } from "@/components/admin/ui";
import type { EmailCampaign, EmailCampaignRecipient } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<EmailCampaign["status"], BadgeTone> = {
  draft: "neutral",
  sending: "info",
  paused: "warning",
  completed: "success",
};

const recipientStatusIcon: Record<EmailCampaignRecipient["status"], React.ComponentType<{ size?: number }>> = {
  pending: Clock,
  sent: CheckCircle2,
  failed: XCircle,
  skipped_unsubscribed: XCircle,
  bounced: AlertOctagon,
  complained: Ban,
};

export default async function EmailCampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const [result, settings] = await Promise.all([getEmailCampaignById(id), getEmailSendSettings()]);
  if (!result) notFound();
  const { campaign, template, recipients } = result;

  const isPaused = !!settings.paused_until && new Date(settings.paused_until) > new Date();
  const progressPct = campaign.total_recipients > 0 ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100) : 0;

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email">Email</BackLink>
      <PageHeader
        title={campaign.name}
        subtitle={template ? `Template: ${template.name} — "${template.subject}"` : "Template no longer exists"}
        action={<Badge tone={statusTones[campaign.status]}>{campaign.status}</Badge>}
      />

      {isPaused && (
        <Card className="border-amber-200 bg-amber-50">
          <p className="text-sm font-semibold text-amber-800">Sending is paused</p>
          <p className="mt-1 text-xs text-amber-700">{settings.pause_reason}</p>
        </Card>
      )}

      <Card className="flex flex-col gap-4">
        <div>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {campaign.sent_count} sent · {campaign.failed_count} failed · {campaign.total_recipients} total
            </span>
            <span>{progressPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${progressPct}%` }} />
          </div>
        </div>
        <CampaignSendPanel campaign={campaign} isPaused={isPaused} />
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-gray-100 bg-gray-50 px-5 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Recipients (first 500)</p>
        </div>
        <div className="max-h-[480px] overflow-y-auto">
          {recipients.map((r) => {
            const Icon = recipientStatusIcon[r.status];
            const tone: BadgeTone =
              r.status === "sent"
                ? "success"
                : r.status === "failed" || r.status === "complained"
                  ? "danger"
                  : r.status === "bounced"
                    ? "warning"
                    : "neutral";
            return (
              <div key={r.id} className="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-2.5 text-sm last:border-b-0">
                <div className="flex min-w-0 items-center gap-2">
                  <Icon size={14} />
                  <span className="truncate text-gray-700">{r.email}</span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {r.error && <span className="max-w-[220px] truncate text-xs text-red-500" title={r.error}>{r.error}</span>}
                  {r.status === "sent" && r.delivered_at && (
                    <span className="text-xs text-emerald-600" title={`Delivered ${new Date(r.delivered_at).toLocaleString()}`}>
                      delivered
                    </span>
                  )}
                  <Badge tone={tone}>{r.status.replace("_", " ")}</Badge>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </AdminShell>
  );
}
