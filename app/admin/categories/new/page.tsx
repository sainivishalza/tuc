import { requireAdminPage } from "@/lib/adminAuth";
import CategoryPageForm from "@/components/admin/CategoryPageForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewCategoryPagePage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/categories">
      <BackLink href="/admin/categories">Category Pages</BackLink>
      <PageHeader title="New category page" />

      <Card className="max-w-3xl">
        <CategoryPageForm />
      </Card>
    </AdminShell>
  );
}
