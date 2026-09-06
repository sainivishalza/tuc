import Link from "next/link";
import { ArrowLeft, Plus, Trash2, FileText, FileSpreadsheet } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllShipments, deleteShipment } from "@/lib/actions/shipments";
import { getAllCarriers } from "@/lib/actions/carriers";
import type { ShipmentStatus } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusLabels: Record<ShipmentStatus, string> = {
  not_found: "Not found",
  not_shipped: "Not shipped",
  in_transit: "In transit",
  delayed: "Delayed",
  delivered: "Delivered",
  exception: "Exception",
};

const statusStyles: Record<ShipmentStatus, string> = {
  not_found: "bg-gray-100 text-gray-500",
  not_shipped: "bg-gray-100 text-gray-500",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  exception: "bg-red-100 text-red-700",
};

export default async function ShipmentsAdminPage() {
  await requireAdminPage();
  const [shipments, carriers] = await Promise.all([getAllShipments(), getAllCarriers()]);
  const carrierById = new Map(carriers.map((c) => [c.id, c.name]));

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Shipment Tracking</h1>
            <p className="mt-1 text-sm text-gray-500">
              {shipments.length} shipment{shipments.length === 1 ? "" : "s"}. Customers track
              these directly on the site with just their tracking number —{" "}
              <Link href="/admin/carriers" className="underline">
                manage carriers here
              </Link>.
            </p>
          </div>
          <Link
            href="/admin/shipments/new"
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={15} />
            New shipment
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {shipments.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No shipments yet.
            </div>
          )}

          {shipments.map((s) => (
            <div
              key={s.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[s.status]}`}>
                    {statusLabels[s.status]}
                  </span>
                  {!s.visible && (
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400">
                      Hidden
                    </span>
                  )}
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
                <Link
                  href={`/admin/shipments/${s.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteShipment(s.id);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
