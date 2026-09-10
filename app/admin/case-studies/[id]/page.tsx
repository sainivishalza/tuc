import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getCaseStudyById } from "@/lib/actions/caseStudies";
import CaseStudyForm from "@/components/admin/CaseStudyForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditCaseStudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const caseStudy = await getCaseStudyById(id);

  if (!caseStudy) notFound();

  return (
    <AdminShell current="/admin/case-studies">
      <BackLink href="/admin/case-studies">Case Studies</BackLink>
      <PageHeader title="Edit case study" />

      <Card className="max-w-3xl">
        <CaseStudyForm caseStudyId={caseStudy.id} initial={caseStudy} />
      </Card>
    </AdminShell>
  );
}
