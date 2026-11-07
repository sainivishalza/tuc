"use client";

import { useRouter } from "next/navigation";
import { Trash2, FileText, FileSpreadsheet, PackageCheck } from "lucide-react";
import type { ShipmentStatus } from "@/lib/supabase/types";
import { deleteShipment, type ShipmentListItem } from "@/lib/actions/shipments";
import { Card, EmptyState, Badge, LinkButton, Button, formatLastUpdated, formatReceivedDate, type BadgeTone } from "@/components/admin/ui";

const statusLabels: Record<ShipmentStatus, string> = {
  not_found: "Not found",
  not_shipped: "Order placed",
  in_production: "In production",
  quality_check: "Quality check",
  ready_to_ship: "Ready to ship",
  in_transit: "In transit",
  arrived: "Arrived",
  customs_clearance: "Customs clearance",
  customs_inspection: "Customs inspection",
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
  arrived: "teal",
  customs_clearance: "info",
  customs_inspection: "warning",
  delayed: "warning",
  delivered: "success",
  exception: "danger",
};

export default function ShipmentsListView({
  shipments,
  carrierById,
}: {
  shipments: ShipmentListItem[];
  carrierById: Map<string, string>;
}) {
  const router = useRouter();

  return (
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
            <p className="mt-1.5 truncate font-admin-display text-sm font-semibold text-gray-900">
              {s.tracking_number}
              {s.customer_name && <span className="ml-2 font-normal text-gray-400">— {s.customer_name}</span>}
            </p>
            <p className="truncate text-xs text-gray-400">
              {[s.destination_country, s.current_location, s.total_pieces ? `${s.total_pieces} pcs` : null]
                .filter(Boolean)
                .join(" · ") || "No details yet"}
            </p>
            {s.status_note && <p className="mt-0.5 truncate text-xs text-amber-700">{s.status_note}</p>}
            {s.first_event_at && (
              <p className="mt-1 flex items-center gap-1 text-[11px] font-medium text-gray-500">
                <PackageCheck size={11} className="shrink-0 text-gray-400" />
                {formatReceivedDate(s.first_event_at)}
              </p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <span
              className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-semibold text-indigo-600"
              title={new Date(s.updated_at).toLocaleString()}
            >
              {formatLastUpdated(s.updated_at)}
            </span>
            <div className="flex items-center gap-2">
              <LinkButton href={`/admin/shipments/${s.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={async () => {
                  if (confirm(`Delete shipment ${s.tracking_number}? This can't be undone.`)) {
                    await deleteShipment(s.id);
                    router.refresh();
                  }
                }}
              >
                <Trash2 size={12} />
                Delete
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
