import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getCategoryPageById } from "@/lib/actions/categoryPages";
import CategoryPageForm from "@/components/admin/CategoryPageForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditCategoryPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const category = await getCategoryPageById(id);

  if (!category) notFound();

  return (
    <AdminShell current="/admin/categories">
      <BackLink href="/admin/categories">Category Pages</BackLink>
      <PageHeader title="Edit category page" />

      <Card className="max-w-3xl">
        <CategoryPageForm categoryId={category.id} initial={category} />
      </Card>
    </AdminShell>
  );
}
