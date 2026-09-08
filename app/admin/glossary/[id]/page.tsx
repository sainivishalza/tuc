import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getGlossaryTermById } from "@/lib/actions/glossaryTerms";
import GlossaryTermForm from "@/components/admin/GlossaryTermForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditGlossaryTermPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const term = await getGlossaryTermById(id);

  if (!term) notFound();

  return (
    <AdminShell current="/admin/glossary">
      <BackLink href="/admin/glossary">Glossary Terms</BackLink>
      <PageHeader title="Edit glossary term" />

      <Card className="max-w-3xl">
        <GlossaryTermForm termId={term.id} initial={term} />
      </Card>
    </AdminShell>
  );
}
