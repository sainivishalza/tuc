"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ArrowRight, Package, AlertTriangle } from "lucide-react";
import type { Shipment } from "@/lib/supabase/types";
import { updateShipmentStatus } from "@/lib/actions/shipments";
import { Button } from "@/components/admin/ui";

type ColumnId = "sourcing" | "sample_approved" | "production" | "inspection" | "shipped" | "delivered";

const COLUMNS: { id: ColumnId; label: string; nextStatus: Shipment["status"] | null; nextLabel: string }[] = [
  { id: "sourcing", label: "Sourcing", nextStatus: "not_shipped", nextLabel: "Sample approved" },
  { id: "sample_approved", label: "Sample Approved", nextStatus: "in_production", nextLabel: "Start production" },
  { id: "production", label: "Production", nextStatus: "quality_check", nextLabel: "Send to inspection" },
  { id: "inspection", label: "Inspection", nextStatus: "ready_to_ship", nextLabel: "Pass & ship" },
  { id: "shipped", label: "Shipped", nextStatus: "delivered", nextLabel: "Mark delivered" },
  { id: "delivered", label: "Delivered", nextStatus: null, nextLabel: "" },
];

/**
 * Column placement is derived entirely from real shipment.status +
 * milestone fields — there's no separate "kanban stage" column in the
 * schema, and there doesn't need to be one, since status plus the one
 * milestone that has no status of its own (sample approval) already
 * distinguish all six stages unambiguously.
 */
function columnFor(s: Shipment): ColumnId {
  switch (s.status) {
    case "not_shipped":
      return s.milestone_sample_approved_at ? "sample_approved" : "sourcing";
    case "in_production":
      return "production";
    case "quality_check":
      return "inspection";
    case "ready_to_ship":
    case "in_transit":
    case "delayed":
      return "shipped";
    case "delivered":
      return "delivered";
    // exception / not_found have no dedicated column in this 6-stage
    // board — fall back to whichever real milestone was reached last,
    // so an exception shipment still lands somewhere sensible rather
    // than being hidden.
    default:
      if (s.milestone_shipped_at) return "shipped";
      if (s.milestone_qc_passed_at) return "shipped";
      if (s.milestone_production_started_at) return "production";
      if (s.milestone_sample_approved_at) return "sample_approved";
      return "sourcing";
  }
}

export default function ShipmentKanban({ shipments }: { shipments: Shipment[] }) {
  const [items, setItems] = useState(shipments);
  const [isPending, startTransition] = useTransition();

  function advance(id: string, nextStatus: Shipment["status"]) {
    // Optimistic: move the card immediately, reconcile if the write fails.
    const prev = items;
    setItems((cur) => cur.map((s) => (s.id === id ? { ...s, status: nextStatus } : s)));
    startTransition(async () => {
      try {
        await updateShipmentStatus(id, nextStatus);
      } catch {
        setItems(prev);
      }
    });
  }

  const grouped = COLUMNS.map((col) => ({
    ...col,
    items: items.filter((s) => columnFor(s) === col.id),
  }));

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {grouped.map((col) => (
        <div key={col.id} className="flex w-72 shrink-0 flex-col gap-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">{col.label}</h3>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">
              {col.items.length}
            </span>
          </div>
          <div className="flex flex-1 flex-col gap-2.5 rounded-2xl bg-gray-100/60 p-2.5">
            {col.items.length === 0 ? (
              <p className="px-2 py-6 text-center text-xs text-gray-400">Empty</p>
            ) : (
              col.items.map((s) => (
                <OrderCard
                  key={s.id}
                  shipment={s}
                  nextLabel={col.nextLabel}
                  onAdvance={col.nextStatus ? () => advance(s.id, col.nextStatus!) : undefined}
                  disabled={isPending}
                />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function OrderCard({
  shipment: s,
  nextLabel,
  onAdvance,
  disabled,
}: {
  shipment: Shipment;
  nextLabel: string;
  onAdvance?: () => void;
  disabled: boolean;
}) {
  const isException = s.status === "exception" || s.status === "delayed";

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/admin/shipments/${s.id}`}
          className="flex items-center gap-1.5 truncate font-admin-display text-sm font-semibold text-gray-900 hover:text-accent"
        >
          <Package size={13} className="shrink-0 text-gray-400" />
          <span className="truncate">{s.tracking_number}</span>
        </Link>
        {isException && (
          <span title={s.status === "delayed" ? "Delayed" : "Exception"}>
            <AlertTriangle size={14} className="shrink-0 text-amber-500" />
          </span>
        )}
      </div>
      {s.customer_name && <p className="truncate text-xs text-gray-500">{s.customer_name}</p>}
      <p className="truncate text-xs text-gray-400">
        {[s.destination_country, s.total_pieces ? `${s.total_pieces} pcs` : null].filter(Boolean).join(" · ") || "No details yet"}
      </p>
      {onAdvance && (
        <Button size="sm" variant="secondary" disabled={disabled} onClick={onAdvance} className="mt-1 w-full">
          {nextLabel}
          <ArrowRight size={12} />
        </Button>
      )}
    </div>
  );
}
