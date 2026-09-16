import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailTemplateById } from "@/lib/actions/emailCampaigns";
import EmailTemplateForm from "@/components/admin/EmailTemplateForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditEmailTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminPage();
  const { id } = await params;
  const template = await getEmailTemplateById(id);
  if (!template) notFound();

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email/templates">Email Templates</BackLink>
      <PageHeader title="Edit email template" subtitle={template.name} />

      <Card className="max-w-3xl">
        <EmailTemplateForm template={template} />
      </Card>
    </AdminShell>
  );
}
