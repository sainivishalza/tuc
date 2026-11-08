import { notFound } from "next/navigation";
import Link from "next/link";
import { Package, Gift } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getSupplierById, getSupplierCategoryIds } from "@/lib/actions/suppliers";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
import { getMessagesForSupplier } from "@/lib/actions/supplierMessages";
import SupplierEditForm from "@/components/admin/SupplierEditForm";
import SupplierMessageThread from "@/components/admin/SupplierMessageThread";
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

  const [categories, selectedCategoryIds, messages, referrer] = await Promise.all([
    getAllCategories(),
    getSupplierCategoryIds(id),
    getMessagesForSupplier(id),
    supplier.referred_by_supplier_id ? getSupplierById(supplier.referred_by_supplier_id) : Promise.resolve(null),
  ]);

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

      {referrer && (
        <div className="flex max-w-3xl items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5 text-sm text-gray-700">
          <Gift size={14} className="shrink-0 text-accent" />
          Referred by{" "}
          <Link href={`/admin/suppliers/${referrer.id}`} className="font-medium text-accent hover:underline">
            {referrer.company_name}
          </Link>
          {supplier.status === "approved" && " — credit their referral reward if you haven't already."}
        </div>
      )}

      <Card className="max-w-3xl">
        <SupplierEditForm supplier={supplier} categories={categories} selectedCategoryIds={selectedCategoryIds} />
      </Card>

      <Card className="max-w-3xl">
        <SupplierMessageThread supplierId={id} messages={messages} />
      </Card>
    </AdminShell>
  );
}
