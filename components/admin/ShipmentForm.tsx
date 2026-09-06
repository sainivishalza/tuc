"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createShipment, updateShipment, uploadPackingList, removePackingList } from "@/lib/actions/shipments";
import type { Shipment, ShipmentStatus, Carrier } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "not_found", label: "Not found (no tracking data yet)" },
  { value: "not_shipped", label: "Not yet shipped" },
  { value: "in_transit", label: "In transit" },
  { value: "delayed", label: "Delayed" },
  { value: "delivered", label: "Delivered" },
  { value: "exception", label: "Possible exception" },
];

export default function ShipmentForm({
  shipmentId,
  initial,
  carriers,
}: {
  shipmentId?: string;
  initial?: Shipment;
  carriers: Carrier[];
}) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(initial?.tracking_number ?? "");
  const [carrierId, setCarrierId] = useState(initial?.carrier_id ?? "");
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
  const [customerReference, setCustomerReference] = useState(initial?.customer_reference ?? "");
  const [destinationCountry, setDestinationCountry] = useState(initial?.destination_country ?? "");
  const [totalPieces, setTotalPieces] = useState(initial?.total_pieces?.toString() ?? "");
  const [currentLocation, setCurrentLocation] = useState(initial?.current_location ?? "");
  const [status, setStatus] = useState<ShipmentStatus>(initial?.status ?? "in_transit");
  const [latestUpdate, setLatestUpdate] = useState(initial?.latest_update ?? "");
  const [latestUpdateAt, setLatestUpdateAt] = useState(initial?.latest_update_at ?? "");
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [hasExcel, setHasExcel] = useState(!!initial?.packing_list_excel_path);
  const [hasPdf, setHasPdf] = useState(!!initial?.packing_list_pdf_path);
  const [packingFile, setPackingFile] = useState<File | null>(null);
  const [uploadingPackingList, setUploadingPackingList] = useState(false);
  const [packingListError, setPackingListError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const input = {
        tracking_number: trackingNumber,
        carrier_id: carrierId || null,
        customer_name: customerName || null,
        customer_reference: customerReference || null,
        destination_country: destinationCountry || null,
        total_pieces: totalPieces ? Number(totalPieces) : null,
        current_location: currentLocation || null,
        status,
        latest_update: latestUpdate || null,
        latest_update_at: latestUpdateAt || null,
        visible,
      };

      let id = shipmentId;
      if (id) {
        await updateShipment(id, input);
      } else {
        id = await createShipment(input);
      }

      if (packingFile && id) {
        setUploadingPackingList(true);
        setPackingListError("");
        try {
          await uploadPackingList(id, packingFile);
        } catch (err) {
          setPackingListError(
            err instanceof Error ? err.message : "Packing list upload failed."
          );
          setUploadingPackingList(false);
          setSubmitting(false);
          return;
        }
        setUploadingPackingList(false);
      }

      router.push("/admin/shipments");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  async function handleRemovePackingList() {
    if (!shipmentId) return;
    setPackingListError("");
    try {
      await removePackingList(shipmentId);
      setHasExcel(false);
      setHasPdf(false);
    } catch (err) {
      setPackingListError(err instanceof Error ? err.message : "Failed to remove packing list.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Tracking number *</label>
          <input
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="FZBZA0822039"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-gray-400">This is the number your customer uses to track — give it to them directly.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Carrier</label>
          <select
            value={carrierId}
            onChange={(e) => setCarrierId(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            <option value="">— None —</option>
            {carriers.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
        The two fields below are for you only — they never appear on the public tracking page,
        so you can tell whose parcel this is without customers seeing each other&apos;s names.
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Customer name (private)</label>
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Thabo M."
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Your reference (private)</label>
          <input
            value={customerReference}
            onChange={(e) => setCustomerReference(e.target.value)}
            placeholder="e.g. order email, WhatsApp note"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Destination country</label>
          <input
            value={destinationCountry}
            onChange={(e) => setDestinationCountry(e.target.value)}
            placeholder="South Africa"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Total pieces</label>
          <input
            type="number"
            min="0"
            value={totalPieces}
            onChange={(e) => setTotalPieces(e.target.value)}
            placeholder="34"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Current location</label>
          <input
            value={currentLocation}
            onChange={(e) => setCurrentLocation(e.target.value)}
            placeholder="Nansha"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Status *</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Status date</label>
          <input
            type="date"
            value={latestUpdateAt ?? ""}
            onChange={(e) => setLatestUpdateAt(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Latest update</label>
        <input
          value={latestUpdate}
          onChange={(e) => setLatestUpdate(e.target.value)}
          placeholder="e.g. Customs clearance complete"
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={visible} onChange={(e) => setVisible(e.target.checked)} />
        Visible on the public tracking page
      </label>

      <div className="rounded-xl border border-gray-200 p-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700">
          Packing list (Excel — a matching PDF is generated automatically)
        </label>
        {(hasExcel || hasPdf) && !packingFile && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span>A packing list is already uploaded (Excel + PDF available to the customer).</span>
            {shipmentId && (
              <button
                type="button"
                onClick={handleRemovePackingList}
                className="font-semibold text-emerald-900 underline"
              >
                Remove
              </button>
            )}
          </div>
        )}
        <input
          type="file"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={(e) => setPackingFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Upload the packing list as Excel (.xlsx). The customer will be able to download it as
          Excel or as an auto-generated PDF, whichever they prefer.
        </p>
        {uploadingPackingList && <p className="mt-2 text-xs text-gray-500">Uploading and converting…</p>}
        {packingListError && <p className="mt-2 text-xs text-red-500">{packingListError}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : shipmentId ? "Save changes" : "Create shipment"}
      </button>
    </form>
  );
}
