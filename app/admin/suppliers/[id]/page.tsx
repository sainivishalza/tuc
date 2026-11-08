import { notFound } from "next/navigation";
import Link from "next/link";
import { Package } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getSupplierById, getSupplierCategoryIds } from "@/lib/actions/suppliers";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
import SupplierEditForm from "@/components/admin/SupplierEditForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const supplier = await getSupplierById(id);

  if (!supplier) notFound();

  const [categories, selectedCategoryIds] = await Promise.all([getAllCategories(), getSupplierCategoryIds(id)]);

  return (
    <AdminShell current="/admin/suppliers">
      <BackLink href="/admin/suppliers">Suppliers</BackLink>
      <PageHeader
        title={`Edit ${supplier.company_name}`}
        action={
          <Link
            href={`/admin/products?q=${encodeURIComponent(supplier.company_name)}`}
            className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <Package size={14} />
            View their products
          </Link>
        }
      />

      <Card className="max-w-3xl">
        <SupplierEditForm supplier={supplier} categories={categories} selectedCategoryIds={selectedCategoryIds} />
      </Card>
    </AdminShell>
  );
}
