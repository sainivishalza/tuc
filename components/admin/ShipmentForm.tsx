"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createShipment,
  updateShipment,
  uploadPackingList,
  removePackingList,
  uploadProofOfDelivery,
  removeProofOfDelivery,
  addShipmentEvent,
  deleteShipmentEvent,
} from "@/lib/actions/shipments";
import type { Shipment, ShipmentStatus, Carrier, ShipmentEvent } from "@/lib/supabase/types";

const STATUS_OPTIONS: { value: ShipmentStatus; label: string }[] = [
  { value: "not_found", label: "Not found (no tracking data yet)" },
  { value: "not_shipped", label: "Not yet shipped" },
  { value: "in_transit", label: "In transit" },
  { value: "delayed", label: "Delayed" },
  { value: "delivered", label: "Delivered" },
  { value: "exception", label: "Possible exception" },
];

type MilestoneKey =
  | "milestone_received_at"
  | "milestone_shipped_at"
  | "milestone_departed_at"
  | "milestone_arrived_at"
  | "milestone_out_for_delivery_at"
  | "milestone_delivered_at";

const MILESTONES: { key: MilestoneKey; label: string }[] = [
  { key: "milestone_received_at", label: "Received (in storage)" },
  { key: "milestone_shipped_at", label: "Shipped (out of storage)" },
  { key: "milestone_departed_at", label: "Departed (place of dispatch)" },
  { key: "milestone_arrived_at", label: "Arrived (destination country)" },
  { key: "milestone_out_for_delivery_at", label: "Out for delivery" },
  { key: "milestone_delivered_at", label: "Delivered (signed)" },
];

function toDatetimeLocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocal(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatEventAt(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ShipmentForm({
  shipmentId,
  initial,
  carriers,
  initialEvents,
}: {
  shipmentId?: string;
  initial?: Shipment;
  carriers: Carrier[];
  initialEvents?: ShipmentEvent[];
}) {
  const router = useRouter();
  const [trackingNumber, setTrackingNumber] = useState(initial?.tracking_number ?? "");
  const [carrierId, setCarrierId] = useState(initial?.carrier_id ?? "");
  const [customerName, setCustomerName] = useState(initial?.customer_name ?? "");
  const [customerReference, setCustomerReference] = useState(initial?.customer_reference ?? "");
  const [carrierReferenceNo, setCarrierReferenceNo] = useState(initial?.carrier_reference_no ?? "");
  const [recipientPostalCode, setRecipientPostalCode] = useState(initial?.recipient_postal_code ?? "");
  const [destinationCountry, setDestinationCountry] = useState(initial?.destination_country ?? "");
  const [totalPieces, setTotalPieces] = useState(initial?.total_pieces?.toString() ?? "");
  const [currentLocation, setCurrentLocation] = useState(initial?.current_location ?? "");
  const [status, setStatus] = useState<ShipmentStatus>(initial?.status ?? "in_transit");
  const [milestones, setMilestones] = useState<Record<MilestoneKey, string>>({
    milestone_received_at: toDatetimeLocal(initial?.milestone_received_at),
    milestone_shipped_at: toDatetimeLocal(initial?.milestone_shipped_at),
    milestone_departed_at: toDatetimeLocal(initial?.milestone_departed_at),
    milestone_arrived_at: toDatetimeLocal(initial?.milestone_arrived_at),
    milestone_out_for_delivery_at: toDatetimeLocal(initial?.milestone_out_for_delivery_at),
    milestone_delivered_at: toDatetimeLocal(initial?.milestone_delivered_at),
  });
  const [visible, setVisible] = useState(initial?.visible ?? true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [hasExcel, setHasExcel] = useState(!!initial?.packing_list_excel_path);
  const [hasPdf, setHasPdf] = useState(!!initial?.packing_list_pdf_path);
  const [packingFile, setPackingFile] = useState<File | null>(null);
  const [uploadingPackingList, setUploadingPackingList] = useState(false);
  const [packingListError, setPackingListError] = useState("");

  const [hasPod, setHasPod] = useState(!!initial?.pod_file_path);
  const [podFile, setPodFile] = useState<File | null>(null);
  const [uploadingPod, setUploadingPod] = useState(false);
  const [podError, setPodError] = useState("");

  const [events, setEvents] = useState<ShipmentEvent[]>(initialEvents ?? []);
  const [newEventAt, setNewEventAt] = useState("");
  const [newEventDesc, setNewEventDesc] = useState("");
  const [addingEvent, setAddingEvent] = useState(false);
  const [eventError, setEventError] = useState("");

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
        carrier_reference_no: carrierReferenceNo || null,
        recipient_postal_code: recipientPostalCode || null,
        destination_country: destinationCountry || null,
        total_pieces: totalPieces ? Number(totalPieces) : null,
        current_location: currentLocation || null,
        status,
        milestone_received_at: fromDatetimeLocal(milestones.milestone_received_at),
        milestone_shipped_at: fromDatetimeLocal(milestones.milestone_shipped_at),
        milestone_departed_at: fromDatetimeLocal(milestones.milestone_departed_at),
        milestone_arrived_at: fromDatetimeLocal(milestones.milestone_arrived_at),
        milestone_out_for_delivery_at: fromDatetimeLocal(milestones.milestone_out_for_delivery_at),
        milestone_delivered_at: fromDatetimeLocal(milestones.milestone_delivered_at),
        visible,
      };

      const wasCreate = !shipmentId;
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

      if (podFile && id) {
        setUploadingPod(true);
        setPodError("");
        try {
          await uploadProofOfDelivery(id, podFile);
        } catch (err) {
          setPodError(err instanceof Error ? err.message : "Proof of delivery upload failed.");
          setUploadingPod(false);
          setSubmitting(false);
          return;
        }
        setUploadingPod(false);
      }

      if (wasCreate && id) {
        router.push(`/admin/shipments/${id}`);
      } else {
        router.push("/admin/shipments");
      }
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

  async function handleRemoveProofOfDelivery() {
    if (!shipmentId) return;
    setPodError("");
    try {
      await removeProofOfDelivery(shipmentId);
      setHasPod(false);
    } catch (err) {
      setPodError(err instanceof Error ? err.message : "Failed to remove proof of delivery.");
    }
  }

  async function handleAddEvent() {
    if (!shipmentId) return;
    setEventError("");
    const iso = fromDatetimeLocal(newEventAt);
    if (!iso) {
      setEventError("Date/time is required.");
      return;
    }
    if (!newEventDesc.trim()) {
      setEventError("Description is required.");
      return;
    }
    setAddingEvent(true);
    try {
      await addShipmentEvent(shipmentId, iso, newEventDesc);
      setEvents((prev) =>
        [
          { id: crypto.randomUUID(), shipment_id: shipmentId, event_at: iso, description: newEventDesc.trim(), created_at: new Date().toISOString() },
          ...prev,
        ].sort((a, b) => (a.event_at < b.event_at ? 1 : -1))
      );
      setNewEventAt("");
      setNewEventDesc("");
      router.refresh();
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Failed to add update.");
    } finally {
      setAddingEvent(false);
    }
  }

  async function handleDeleteEvent(eventId: string) {
    setEventError("");
    try {
      await deleteShipmentEvent(eventId);
      setEvents((prev) => prev.filter((ev) => ev.id !== eventId));
      router.refresh();
    } catch (err) {
      setEventError(err instanceof Error ? err.message : "Failed to remove update.");
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
        The fields below are for you only — they never appear on the public tracking page,
        so you can tell whose parcel this is (and match it against the carrier&apos;s own
        system) without customers seeing each other&apos;s details.
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
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Carrier reference / waybill no. (private)</label>
          <input
            value={carrierReferenceNo}
            onChange={(e) => setCarrierReferenceNo(e.target.value)}
            placeholder="e.g. the carrier's own reference number"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Recipient postal code (private)</label>
          <input
            value={recipientPostalCode}
            onChange={(e) => setRecipientPostalCode(e.target.value)}
            placeholder="e.g. 2000"
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

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Status *</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as ShipmentStatus)}
          className="w-full max-w-xs rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 p-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700">
          Milestone tracker (shown to the customer as a progress bar)
        </label>
        <p className="mb-3 text-[11px] text-gray-400">
          Leave a step blank if it hasn&apos;t happened yet. Filling one in marks that step complete
          on the public tracking page.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MILESTONES.map((m) => (
            <div key={m.key}>
              <label className="mb-1 block text-[11px] font-medium text-gray-600">{m.label}</label>
              <input
                type="datetime-local"
                value={milestones[m.key]}
                onChange={(e) =>
                  setMilestones((prev) => ({ ...prev, [m.key]: e.target.value }))
                }
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
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

      <div className="rounded-xl border border-gray-200 p-4">
        <label className="mb-1 block text-xs font-semibold text-gray-700">
          Proof of delivery (photo or scanned signed receipt)
        </label>
        {hasPod && !podFile && (
          <div className="mb-3 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
            <span>A proof of delivery is uploaded and available to the customer.</span>
            {shipmentId && (
              <button
                type="button"
                onClick={handleRemoveProofOfDelivery}
                className="font-semibold text-emerald-900 underline"
              >
                Remove
              </button>
            )}
          </div>
        )}
        <input
          type="file"
          accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
          onChange={(e) => setPodFile(e.target.files?.[0] ?? null)}
          className="w-full text-sm"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Upload once the parcel is signed for — a photo of the signed waybill or delivery note
          works well. The customer will be able to view or download it from the tracking page.
        </p>
        {uploadingPod && <p className="mt-2 text-xs text-gray-500">Uploading…</p>}
        {podError && <p className="mt-2 text-xs text-red-500">{podError}</p>}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : shipmentId ? "Save changes" : "Create shipment"}
      </button>

      {shipmentId && (
        <div className="mt-2 rounded-xl border border-gray-200 p-4">
          <label className="mb-1 block text-xs font-semibold text-gray-700">
            Updates (shown to the customer as a timeline, most recent first)
          </label>
          <p className="mb-3 text-[11px] text-gray-400">
            Type each update in one language only — whatever language the customer selected the
            site in isn&apos;t translated for you, so keep it in plain English (or the language
            your customers actually read) rather than mixing languages in one line.
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="sm:w-56">
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Date/time</label>
              <input
                type="datetime-local"
                value={newEventAt}
                onChange={(e) => setNewEventAt(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex-1">
              <label className="mb-1 block text-[11px] font-medium text-gray-600">Description</label>
              <input
                value={newEventDesc}
                onChange={(e) => setNewEventDesc(e.target.value)}
                placeholder="e.g. Customs clearance complete, released for delivery"
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="button"
              onClick={handleAddEvent}
              disabled={addingEvent}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
            >
              {addingEvent ? "Adding..." : "Add"}
            </button>
          </div>
          {eventError && <p className="mt-2 text-xs text-red-500">{eventError}</p>}

          {events.length > 0 ? (
            <ul className="mt-4 flex flex-col gap-2">
              {events.map((ev) => (
                <li
                  key={ev.id}
                  className="flex items-start justify-between gap-3 rounded-lg bg-gray-50 px-3 py-2 text-sm"
                >
                  <div>
                    <p className="text-[11px] font-medium text-gray-500">{formatEventAt(ev.event_at)}</p>
                    <p className="text-gray-800">{ev.description}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEvent(ev.id)}
                    className="shrink-0 text-xs font-semibold text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-xs text-gray-400">No updates yet.</p>
          )}
        </div>
      )}
    </form>
  );
}
