"use client";

import { useState } from "react";
import { Search, Package, MapPin, Truck, Clock, FileSpreadsheet, FileText, Check } from "lucide-react";
import { trackShipment, getPackingListUrl, getPublicShipmentEvents } from "@/lib/actions/shipments";
import type { Dictionary } from "@/lib/i18n";
import type { PublicShipment, ShipmentEvent, ShipmentStatus } from "@/lib/supabase/types";

const statusColors: Record<ShipmentStatus, string> = {
  not_found: "bg-gray-100 text-gray-500",
  not_shipped: "bg-gray-100 text-gray-500",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  exception: "bg-red-100 text-red-700",
};

type MilestoneField =
  | "milestone_received_at"
  | "milestone_shipped_at"
  | "milestone_departed_at"
  | "milestone_arrived_at"
  | "milestone_out_for_delivery_at"
  | "milestone_delivered_at";

function milestoneSteps(dict: Dictionary): { field: MilestoneField; label: string }[] {
  return [
    { field: "milestone_received_at", label: dict.tracking.milestones.received },
    { field: "milestone_shipped_at", label: dict.tracking.milestones.shipped },
    { field: "milestone_departed_at", label: dict.tracking.milestones.departed },
    { field: "milestone_arrived_at", label: dict.tracking.milestones.arrived },
    { field: "milestone_out_for_delivery_at", label: dict.tracking.milestones.outForDelivery },
    { field: "milestone_delivered_at", label: dict.tracking.milestones.delivered },
  ];
}

function formatEventDate(iso: string): string {
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

export default function TrackingLookup({ dict }: { dict: Dictionary }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [result, setResult] = useState<PublicShipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    const shipment = await trackShipment(value);
    setResult(shipment);
    setEvents(shipment ? await getPublicShipmentEvents(shipment.id) : []);
    setLoading(false);
  }

  async function handleDownload(format: "excel" | "pdf") {
    setDownloading(format);
    try {
      const url = await getPackingListUrl(value, format);
      if (!url) return;

      // Fetch and save via a same-origin blob URL rather than
      // navigating to the signed URL directly — a cross-origin link's
      // `download` attribute is ignored by browsers, so a direct
      // navigation opens the file (or blanks the page) instead of
      // downloading it and saving it under a sensible filename.
      const res = await fetch(url);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = format === "excel" ? "packing-list.xlsx" : "packing-list.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } finally {
      setDownloading(null);
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="mx-auto flex max-w-xl flex-col gap-3 sm:flex-row">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={dict.tracking.inputPlaceholder}
          required
          className="glass-strong flex-1 rounded-full px-5 py-3.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
        />
        <button
          type="submit"
          disabled={loading}
          className="brand-gradient flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:scale-105 disabled:opacity-60"
        >
          <Search size={16} />
          {dict.tracking.button}
        </button>
      </form>

      {searched && !loading && !result && (
        <div className="glass-strong mx-auto mt-8 max-w-xl rounded-2xl p-6 text-center text-sm text-muted">
          {dict.tracking.notFound}
        </div>
      )}

      {result && (
        <div className="glass-strong mx-auto mt-8 max-w-xl rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-display text-lg font-semibold">{result.tracking_number}</p>
            <span className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusColors[result.status]}`}>
              {dict.tracking.status[result.status]}
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {result.destination_country && (
              <Detail icon={<MapPin size={15} />} label={dict.tracking.destinationLabel} value={result.destination_country} />
            )}
            {result.current_location && (
              <Detail icon={<Truck size={15} />} label={dict.tracking.locationLabel} value={result.current_location} />
            )}
            {result.total_pieces != null && (
              <Detail icon={<Package size={15} />} label={dict.tracking.piecesLabel} value={String(result.total_pieces)} />
            )}
            {result.carrier_name && (
              <Detail icon={<Truck size={15} />} label={dict.tracking.carrierLabel} value={result.carrier_name} />
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="font-display text-sm font-semibold">{dict.tracking.milestones.title}</p>
            <MilestoneTracker dict={dict} shipment={result} />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="font-display text-sm font-semibold">{dict.tracking.updatesTitle}</p>
            {events.length > 0 ? (
              <ul className="mt-3 flex flex-col gap-3">
                {events.map((ev) => (
                  <li key={ev.id} className="flex gap-3">
                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                    <div>
                      <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Clock size={12} />
                        {formatEventDate(ev.event_at)}
                      </p>
                      <p className="mt-0.5 text-sm">{ev.description}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-xs text-muted">{dict.tracking.noUpdates}</p>
            )}
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <p className="font-display text-sm font-semibold">{dict.tracking.packingListTitle}</p>
            {result.has_excel || result.has_pdf ? (
              <>
                <p className="mt-1 text-xs text-muted">{dict.tracking.packingListSubtitle}</p>
                <div className="mt-3 flex flex-wrap gap-3">
                  {result.has_excel && (
                    <button
                      onClick={() => handleDownload("excel")}
                      disabled={downloading === "excel"}
                      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent disabled:opacity-60"
                    >
                      <FileSpreadsheet size={14} />
                      {dict.tracking.downloadExcel}
                    </button>
                  )}
                  {result.has_pdf && (
                    <button
                      onClick={() => handleDownload("pdf")}
                      disabled={downloading === "pdf"}
                      className="flex items-center gap-1.5 rounded-full border border-border px-4 py-2 text-xs font-semibold transition hover:border-accent hover:text-accent disabled:opacity-60"
                    >
                      <FileText size={14} />
                      {dict.tracking.downloadPdf}
                    </button>
                  )}
                </div>
              </>
            ) : (
              <p className="mt-1 text-xs text-muted">{dict.tracking.noPackingList}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-accent">{icon}</span>
      <div>
        <p className="text-xs text-muted">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function MilestoneTracker({ dict, shipment }: { dict: Dictionary; shipment: PublicShipment }) {
  const steps = milestoneSteps(dict);
  const dates = steps.map((s) => shipment[s.field]);
  let lastDoneIndex = -1;
  dates.forEach((d, i) => {
    if (d) lastDoneIndex = i;
  });

  return (
    <div className="mt-4 flex items-start justify-between gap-1 overflow-x-auto pb-1">
      {steps.map((step, i) => {
        const date = dates[i];
        const done = i <= lastDoneIndex;
        const isCurrent = i === lastDoneIndex;
        return (
          <div key={step.field} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span
                className={`h-0.5 flex-1 ${i === 0 ? "opacity-0" : done ? "bg-accent" : "bg-border"}`}
              />
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-white ${
                  done ? "brand-gradient" : "bg-border text-muted"
                } ${isCurrent ? "ring-2 ring-accent/40 ring-offset-2 ring-offset-surface" : ""}`}
              >
                {done ? <Check size={14} /> : <span className="h-1.5 w-1.5 rounded-full bg-muted" />}
              </span>
              <span
                className={`h-0.5 flex-1 ${i === steps.length - 1 ? "opacity-0" : done && i < lastDoneIndex ? "bg-accent" : "bg-border"}`}
              />
            </div>
            <p className={`mt-2 max-w-[80px] text-[11px] font-medium ${done ? "text-foreground" : "text-muted"}`}>
              {step.label}
            </p>
            {date && <p className="mt-0.5 text-[10px] text-muted">{formatEventDate(date)}</p>}
          </div>
        );
      })}
    </div>
  );
}
