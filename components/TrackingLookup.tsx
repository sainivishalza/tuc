"use client";

import { useState } from "react";
import { Search, Package, MapPin, Truck, Clock, FileSpreadsheet, FileText } from "lucide-react";
import { trackShipment, getPackingListUrl } from "@/lib/actions/shipments";
import type { Dictionary } from "@/lib/i18n";
import type { PublicShipment, ShipmentStatus } from "@/lib/supabase/types";

const statusColors: Record<ShipmentStatus, string> = {
  not_found: "bg-gray-100 text-gray-500",
  not_shipped: "bg-gray-100 text-gray-500",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  exception: "bg-red-100 text-red-700",
};

export default function TrackingLookup({ dict }: { dict: Dictionary }) {
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<"excel" | "pdf" | null>(null);
  const [result, setResult] = useState<PublicShipment | null>(null);
  const [searched, setSearched] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return;
    setLoading(true);
    setSearched(true);
    const shipment = await trackShipment(value);
    setResult(shipment);
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

          {result.latest_update && (
            <div className="mt-5 rounded-xl border-l-4 border-accent bg-surface-2 p-4">
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                <Clock size={13} />
                {dict.tracking.updatedLabel}
                {result.latest_update_at ? ` · ${result.latest_update_at}` : ""}
              </p>
              <p className="mt-1 text-sm">{result.latest_update}</p>
            </div>
          )}

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
