import { Plus } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllShipments } from "@/lib/actions/shipments";
import { getAllCarriers } from "@/lib/actions/carriers";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, LinkButton } from "@/components/admin/ui";
import ShipmentKanban from "@/components/admin/ShipmentKanban";
import ShipmentsListView from "@/components/admin/ShipmentsListView";
import ShipmentsViewSwitcher from "@/components/admin/ShipmentsViewSwitcher";
import Link from "next/link";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ShipmentsAdminPage() {
  await requireAdminPage();
  const [shipments, carriers] = await Promise.all([getAllShipments(), getAllCarriers()]);
  const carrierById = new Map(carriers.map((c) => [c.id, c.name]));

  return (
    <AdminShell current="/admin/shipments" fullWidth>
      <PageHeader
        title="Order Tracking"
        subtitle={
          <>
            {shipments.length} shipment{shipments.length === 1 ? "" : "s"}. Customers track these directly
            on the site with just their tracking number —{" "}
            <Link href="/admin/carriers" className="underline">
              manage carriers here
            </Link>
            .
          </>
        }
        action={
          <LinkButton href="/admin/shipments/new">
            <Plus size={15} />
            New shipment
          </LinkButton>
        }
      />

      <ShipmentsViewSwitcher
        board={<ShipmentKanban shipments={shipments} />}
        list={<ShipmentsListView shipments={shipments} carrierById={carrierById} />}
      />
    </AdminShell>
  );
}
