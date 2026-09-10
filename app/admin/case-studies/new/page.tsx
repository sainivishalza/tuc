import { requireAdminPage } from "@/lib/adminAuth";
import CaseStudyForm from "@/components/admin/CaseStudyForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewCaseStudyPage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/case-studies">
      <BackLink href="/admin/case-studies">Case Studies</BackLink>
      <PageHeader title="New case study" />

      <Card className="max-w-3xl">
        <CaseStudyForm />
      </Card>
    </AdminShell>
  );
}
