import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCarriers } from "@/lib/actions/carriers";
import { getShipmentCustomers } from "@/lib/actions/shipments";
import ShipmentForm from "@/components/admin/ShipmentForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewShipmentPage() {
  await requireAdminPage();
  const [carriers, customers] = await Promise.all([getAllCarriers(), getShipmentCustomers()]);

  return (
    <AdminShell current="/admin/shipments">
      <BackLink href="/admin/shipments">Shipment Tracking</BackLink>
      <PageHeader title="New shipment" />

      <Card className="max-w-2xl">
        <ShipmentForm carriers={carriers} customers={customers} />
      </Card>
    </AdminShell>
  );
}
