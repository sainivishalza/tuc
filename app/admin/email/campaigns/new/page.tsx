import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailTemplates } from "@/lib/actions/emailCampaigns";
import NewCampaignForm from "@/components/admin/NewCampaignForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card, EmptyState, LinkButton } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewEmailCampaignPage() {
  await requireAdminPage();
  const templates = await getEmailTemplates();

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email">Email</BackLink>
      <PageHeader title="New campaign" />

      {templates.length === 0 ? (
        <EmptyState action={<LinkButton href="/admin/email/templates/new">Create a template</LinkButton>}>
          You need at least one template before creating a campaign.
        </EmptyState>
      ) : (
        <Card className="max-w-2xl">
          <NewCampaignForm templates={templates} />
        </Card>
      )}
    </AdminShell>
  );
}
