import { requireAdminPage } from "@/lib/adminAuth";
import { getAllSuppliers } from "@/lib/actions/suppliers";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import SupplierDirectory from "@/components/admin/SupplierDirectory";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SuppliersAdminPage() {
  await requireAdminPage();
  const suppliers = await getAllSuppliers();

  return (
    <AdminShell current="/admin/suppliers">
      <PageHeader
        title="Supplier Directory"
        subtitle={`${suppliers.length} registration${suppliers.length === 1 ? "" : "s"}. Only approved suppliers show on the public Verified Suppliers page.`}
      />
      <SupplierDirectory suppliers={suppliers} />
    </AdminShell>
  );
}
