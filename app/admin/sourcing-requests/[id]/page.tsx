import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import {
  getSourcingRequestById,
  getAllCategories,
  getInterestedSuppliers,
  getApprovedSuppliersForPush,
} from "@/lib/actions/sourcingRequests";
import SourcingRequestEditForm from "@/components/admin/SourcingRequestEditForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditSourcingRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const request = await getSourcingRequestById(id);
  if (!request) notFound();

  const [categories, interestedSuppliers, approvedSuppliers] = await Promise.all([
    getAllCategories(),
    getInterestedSuppliers(id),
    getApprovedSuppliersForPush(),
  ]);

  return (
    <AdminShell current="/admin/sourcing-requests">
      <BackLink href="/admin/sourcing-requests">Sourcing Requests</BackLink>
      <PageHeader title={request.title} />

      <Card className="max-w-3xl">
        <SourcingRequestEditForm
          request={request}
          categories={categories}
          interestedSuppliers={interestedSuppliers}
          approvedSuppliers={approvedSuppliers}
        />
      </Card>
    </AdminShell>
  );
}
