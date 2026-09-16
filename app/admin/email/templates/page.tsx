import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailTemplates, deleteEmailTemplate } from "@/lib/actions/emailCampaigns";
import type { EmailTemplate } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<EmailTemplate["status"], BadgeTone> = {
  draft: "neutral",
  active: "success",
};

const categoryTones: Record<EmailTemplate["category"], BadgeTone> = {
  newsletter: "info",
  announcement: "purple",
  promotional: "warning",
  invite: "teal",
  general: "neutral",
};

export default async function EmailTemplatesPage() {
  await requireAdminPage();
  const templates = await getEmailTemplates();

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email">Email</BackLink>
      <PageHeader
        title="Email Templates"
        subtitle={`${templates.length} template${templates.length === 1 ? "" : "s"}.`}
        action={
          <LinkButton href="/admin/email/templates/new">
            <Plus size={15} />
            New template
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {templates.length === 0 && <EmptyState>No templates yet.</EmptyState>}

        {templates.map((t) => (
          <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[t.status]}>{t.status}</Badge>
                <Badge tone={categoryTones[t.category]}>{t.category}</Badge>
              </div>
              <p className="mt-1.5 truncate font-admin-display text-sm font-semibold text-gray-900">{t.name}</p>
              <p className="truncate text-xs text-gray-400">{t.subject}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/email/templates/${t.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteEmailTemplate(t.id);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 size={12} />
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
