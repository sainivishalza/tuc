import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getProductByIdAdmin } from "@/lib/actions/supplierProducts";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
import ProductEditForm from "@/components/admin/ProductEditForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [product, categories] = await Promise.all([getProductByIdAdmin(id), getAllCategories()]);

  if (!product) notFound();

  return (
    <AdminShell current="/admin/products">
      <BackLink href="/admin/products">Products</BackLink>
      <PageHeader title={`Edit ${product.title}`} />

      <Card className="max-w-3xl">
        <ProductEditForm product={product} categories={categories} />
      </Card>
    </AdminShell>
  );
}
