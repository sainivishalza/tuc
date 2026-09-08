import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getShipmentById, getShipmentEvents } from "@/lib/actions/shipments";
import { getAllCarriers } from "@/lib/actions/carriers";
import ShipmentForm from "@/components/admin/ShipmentForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditShipmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const [shipment, carriers] = await Promise.all([getShipmentById(id), getAllCarriers()]);

  if (!shipment) notFound();

  const events = await getShipmentEvents(id);

  return (
    <AdminShell current="/admin/shipments">
      <BackLink href="/admin/shipments">Shipment Tracking</BackLink>
      <PageHeader title="Edit shipment" />

      <Card className="max-w-2xl">
        <ShipmentForm
          shipmentId={shipment.id}
          initial={shipment}
          carriers={carriers}
          initialEvents={events}
        />
      </Card>
    </AdminShell>
  );
}
