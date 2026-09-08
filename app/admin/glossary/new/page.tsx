import { requireAdminPage } from "@/lib/adminAuth";
import GlossaryTermForm from "@/components/admin/GlossaryTermForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewGlossaryTermPage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/glossary">
      <BackLink href="/admin/glossary">Glossary Terms</BackLink>
      <PageHeader title="New glossary term" />

      <Card className="max-w-3xl">
        <GlossaryTermForm />
      </Card>
    </AdminShell>
  );
}
