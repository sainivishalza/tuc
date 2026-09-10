import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getSupplierById } from "@/lib/actions/suppliers";
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

  return (
    <AdminShell current="/admin/suppliers">
      <BackLink href="/admin/suppliers">Suppliers</BackLink>
      <PageHeader title={`Edit ${supplier.company_name}`} />

      <Card className="max-w-3xl">
        <SupplierEditForm supplier={supplier} />
      </Card>
    </AdminShell>
  );
}
