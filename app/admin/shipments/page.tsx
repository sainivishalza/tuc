import Link from "next/link";
import { Plus, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllShipments, deleteShipment } from "@/lib/actions/shipments";
import { getAllCarriers } from "@/lib/actions/carriers";
import type { ShipmentStatus } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusLabels: Record<ShipmentStatus, string> = {
  not_found: "Not found",
  not_shipped: "Order placed",
  in_production: "In production",
  quality_check: "Quality check",
  ready_to_ship: "Ready to ship",
  in_transit: "In transit",
  delayed: "Delayed",
  delivered: "Delivered",
  exception: "Exception",
};

const statusTones: Record<ShipmentStatus, BadgeTone> = {
  not_found: "neutral",
  not_shipped: "neutral",
  in_production: "purple",
  quality_check: "indigo",
  ready_to_ship: "teal",
  in_transit: "info",
  delayed: "warning",
  delivered: "success",
  exception: "danger",
};

export default async function ShipmentsAdminPage() {
  await requireAdminPage();
  const [shipments, carriers] = await Promise.all([getAllShipments(), getAllCarriers()]);
  const carrierById = new Map(carriers.map((c) => [c.id, c.name]));

  return (
    <AdminShell current="/admin/shipments">
      <PageHeader
        title="Shipment Tracking"
        subtitle={
          <>
            {shipments.length} shipment{shipments.length === 1 ? "" : "s"}. Customers track these
            directly on the site with just their tracking number —{" "}
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

      <div className="flex flex-col gap-3">
        {shipments.length === 0 && <EmptyState>No shipments yet.</EmptyState>}

        {shipments.map((s) => (
          <Card key={s.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={statusTones[s.status]}>{statusLabels[s.status]}</Badge>
                {!s.visible && <Badge>Hidden</Badge>}
                {s.carrier_id && carrierById.has(s.carrier_id) && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">
                    {carrierById.get(s.carrier_id)}
                  </span>
                )}
                {s.packing_list_excel_path && (
                  <span title="Excel packing list on file">
                    <FileSpreadsheet size={13} className="text-emerald-600" />
                  </span>
                )}
                {s.packing_list_pdf_path && (
                  <span title="PDF packing list on file">
                    <FileText size={13} className="text-emerald-600" />
                  </span>
                )}
              </div>
              <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">
                {s.tracking_number}
                {s.customer_name && (
                  <span className="ml-2 font-normal text-gray-400">— {s.customer_name}</span>
                )}
              </p>
              <p className="truncate text-xs text-gray-400">
                {[s.destination_country, s.current_location, s.total_pieces ? `${s.total_pieces} pcs` : null]
                  .filter(Boolean)
                  .join(" · ") || "No details yet"}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/shipments/${s.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteShipment(s.id);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 size={12} />
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
