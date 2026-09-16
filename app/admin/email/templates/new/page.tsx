import { requireAdminPage } from "@/lib/adminAuth";
import EmailTemplateForm from "@/components/admin/EmailTemplateForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewEmailTemplatePage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email/templates">Email Templates</BackLink>
      <PageHeader title="New email template" />

      <Card className="max-w-3xl">
        <EmailTemplateForm />
      </Card>
    </AdminShell>
  );
}
