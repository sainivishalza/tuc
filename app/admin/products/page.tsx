import { requireAdminPage } from "@/lib/adminAuth";
import { getAllProductsAdmin } from "@/lib/actions/supplierProducts";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import ProductsTable from "@/components/admin/ProductsTable";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await requireAdminPage();
  const [products, { q }] = await Promise.all([getAllProductsAdmin(), searchParams]);

  return (
    <AdminShell current="/admin/products">
      <PageHeader
        title="Products"
        subtitle={`${products.length} product${products.length === 1 ? "" : "s"} across all suppliers. Products go live immediately when a supplier adds them — edit or deactivate any listing here.`}
      />
      <ProductsTable products={products} initialSearch={q ?? ""} />
    </AdminShell>
  );
}
