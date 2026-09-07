import "server-only";
import type { ShipmentStatus } from "@/lib/supabase/types";

const DEFAULT_BASE_URL = "https://api-eu.dhl.com/track/shipments";

export interface DhlTrackingEvent {
  event_at: string;
  description: string;
}

export interface DhlTrackingResult {
  /** Null when DHL's status is too ambiguous to map — caller should leave the existing status alone. */
  status: ShipmentStatus | null;
  currentLocation: string | null;
  events: DhlTrackingEvent[];
  milestones: {
    received_at?: string;
    shipped_at?: string;
    departed_at?: string;
    arrived_at?: string;
    out_for_delivery_at?: string;
    delivered_at?: string;
  };
}

interface DhlApiEvent {
  timestamp?: string;
  description?: string;
  location?: { address?: { addressLocality?: string } };
}

interface DhlApiShipment {
  status?: {
    statusCode?: string;
    location?: { address?: { addressLocality?: string } };
  };
  events?: DhlApiEvent[];
}

/** Fetches live tracking data from DHL's Unified Tracking API. Returns null
 * if DHL has no record of this tracking number (not an error — just unknown
 * to them, e.g. too new or not a DHL shipment at all). */
export async function fetchDhlTracking(trackingNumber: string): Promise<DhlTrackingResult | null> {
  const apiKey = process.env.DHL_API_KEY;
  if (!apiKey) {
    throw new Error("DHL_API_KEY is not configured.");
  }

  const baseUrl = process.env.DHL_API_BASE_URL || DEFAULT_BASE_URL;
  const url = `${baseUrl}?trackingNumber=${encodeURIComponent(trackingNumber)}&language=en`;

  const res = await fetch(url, {
    headers: { "DHL-API-Key": apiKey, Accept: "application/json" },
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    const body = await res.text().catch(() => res.statusText);
    throw new Error(`DHL API error (${res.status}): ${body}`);
  }

  const data: { shipments?: DhlApiShipment[] } = await res.json();
  const shipment = data.shipments?.[0];
  if (!shipment) return null;

  const status = mapDhlStatus(shipment.status?.statusCode);

  const events: DhlTrackingEvent[] = (shipment.events ?? [])
    .filter((e): e is Required<Pick<DhlApiEvent, "timestamp" | "description">> & DhlApiEvent =>
      Boolean(e.timestamp && e.description)
    )
    .map((e) => ({
      event_at: new Date(e.timestamp!).toISOString(),
      description: formatEventDescription(e),
    }));

  const milestones = deriveMilestones(events);

  const currentLocation = shipment.status?.location?.address?.addressLocality ?? null;

  return { status, currentLocation, events, milestones };
}

function mapDhlStatus(statusCode: string | undefined): ShipmentStatus | null {
  switch (statusCode) {
    case "pre-transit":
      return "not_shipped";
    case "transit":
      return "in_transit";
    case "delivered":
      return "delivered";
    case "failure":
      return "exception";
    default:
      // "unknown" or missing — DHL isn't telling us anything new, don't
      // clobber whatever status is already on the shipment.
      return null;
  }
}

function formatEventDescription(e: DhlApiEvent): string {
  const location = e.location?.address?.addressLocality;
  return location ? `[${location}] ${e.description}` : (e.description as string);
}

/** DHL doesn't expose our 6-step milestone model directly, so this pattern-
 * matches the (English) event descriptions for the phrases DHL commonly
 * uses. Best-effort: any milestone it can't confidently infer is simply
 * left for the admin to fill in by hand. */
function deriveMilestones(events: DhlTrackingEvent[]): DhlTrackingResult["milestones"] {
  const milestones: DhlTrackingResult["milestones"] = {};
  // DHL returns events newest-first; walk oldest-first so the *earliest*
  // matching event wins for each milestone.
  const chronological = [...events].reverse();

  for (const ev of chronological) {
    const d = ev.description.toLowerCase();
    if (!milestones.received_at && /shipment picked up|pickup|received/.test(d)) {
      milestones.received_at = ev.event_at;
    }
    if (!milestones.shipped_at && /shipment information received|processed/.test(d)) {
      milestones.shipped_at = ev.event_at;
    }
    if (!milestones.departed_at && /departed/.test(d)) {
      milestones.departed_at = ev.event_at;
    }
    if (!milestones.arrived_at && /arrived/.test(d)) {
      milestones.arrived_at = ev.event_at;
    }
    if (!milestones.out_for_delivery_at && /out for delivery/.test(d)) {
      milestones.out_for_delivery_at = ev.event_at;
    }
    if (!milestones.delivered_at && /delivered/.test(d)) {
      milestones.delivered_at = ev.event_at;
    }
  }

  return milestones;
}
