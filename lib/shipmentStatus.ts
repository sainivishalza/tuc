import type { ShipmentStatus } from "./supabase/types";

// Shared between the customer notification emails, the public tracking
// page, and the client portal, so every surface describes a shipment's
// status the same way instead of drifting into slightly different wording.
export const STATUS_LABELS: Record<ShipmentStatus, string> = {
  not_found: "Not found",
  not_shipped: "Order placed",
  in_production: "In production",
  quality_check: "Quality check",
  ready_to_ship: "Ready to ship",
  in_transit: "In transit",
  delayed: "Delayed",
  delivered: "Delivered",
  exception: "Possible exception",
};

export const STATUS_COLORS: Record<ShipmentStatus, string> = {
  not_found: "bg-gray-100 text-gray-500",
  not_shipped: "bg-gray-100 text-gray-500",
  in_production: "bg-purple-100 text-purple-700",
  quality_check: "bg-indigo-100 text-indigo-700",
  ready_to_ship: "bg-teal-100 text-teal-700",
  in_transit: "bg-blue-100 text-blue-700",
  delayed: "bg-amber-100 text-amber-700",
  delivered: "bg-emerald-100 text-emerald-700",
  exception: "bg-red-100 text-red-700",
};
