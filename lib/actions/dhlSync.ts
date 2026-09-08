"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { fetchDhlTracking } from "@/lib/dhl";

const STALE_AFTER_MS = 30 * 60 * 1000; // 30 minutes

export interface SyncResult {
  ok: boolean;
  message: string;
}

/** Core sync logic, shared by the admin's manual "Refresh" button and the
 * automatic refresh triggered from a customer's tracking lookup. Not
 * exported as a server action itself — callers decide their own
 * authorization (admin auth for the manual button, none needed for the
 * public path since it only touches carrier-API data, never private fields). */
async function syncDhlShipment(shipmentId: string, trackingNumber: string): Promise<SyncResult> {
  // Next.js redacts thrown Server Action errors to an opaque message in
  // production builds, so every failure here is returned as a plain value
  // instead of thrown — that's the only way the admin actually sees why a
  // sync failed rather than a meaningless "something went wrong".
  let result;
  try {
    result = await fetchDhlTracking(trackingNumber);
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "Failed to reach DHL." };
  }

  if (!result) {
    return { ok: false, message: "DHL has no tracking record for this number yet." };
  }

  const supabase = getSupabaseAdminClient();

  const update: Record<string, unknown> = {
    last_api_sync_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (result.status) update.status = result.status;
  if (result.currentLocation) update.current_location = result.currentLocation;
  if (result.milestones.received_at) update.milestone_received_at = result.milestones.received_at;
  if (result.milestones.shipped_at) update.milestone_shipped_at = result.milestones.shipped_at;
  if (result.milestones.departed_at) update.milestone_departed_at = result.milestones.departed_at;
  if (result.milestones.arrived_at) update.milestone_arrived_at = result.milestones.arrived_at;
  if (result.milestones.out_for_delivery_at) update.milestone_out_for_delivery_at = result.milestones.out_for_delivery_at;
  if (result.milestones.delivered_at) update.milestone_delivered_at = result.milestones.delivered_at;

  const { error: updateError } = await supabase.from("shipments").update(update).eq("id", shipmentId);
  if (updateError) return { ok: false, message: updateError.message };

  let newEventCount = 0;
  if (result.events.length > 0) {
    const rows = result.events.map((e) => ({
      shipment_id: shipmentId,
      event_at: e.event_at,
      description: e.description,
    }));
    const { data: inserted, error: insertError } = await supabase
      .from("shipment_events")
      .upsert(rows, { onConflict: "shipment_id,event_at,description", ignoreDuplicates: true })
      .select("id");
    if (insertError) return { ok: false, message: insertError.message };
    newEventCount = inserted?.length ?? 0;
  }

  return {
    ok: true,
    message: `Synced from DHL: status ${result.status ?? "unchanged"}, ${newEventCount} new update${newEventCount === 1 ? "" : "s"}.`,
  };
}

/** Best-effort auto-refresh used by the public tracking lookup — never
 * throws, since a DHL outage should never break tracking for shipments
 * we already have cached data for.
 *
 * This is an exported Server Action, i.e. a directly callable network
 * endpoint — never trust a caller-supplied tracking number or carrier
 * check here, only the shipmentId. Everything else is re-derived from
 * the database so a mismatched (shipmentId, trackingNumber) pair from a
 * hand-crafted request can't overwrite one shipment's data with another
 * tracking number's, or force a sync on a non-DHL shipment. */
export async function autoSyncIfStale(shipmentId: string): Promise<boolean> {
  const supabase = getSupabaseAdminClient();
  const { data: shipment } = await supabase
    .from("shipments")
    .select("tracking_number, last_api_sync_at, carriers(api_provider)")
    .eq("id", shipmentId)
    .maybeSingle();

  if (!shipment) return false;
  const apiProvider = (shipment.carriers as unknown as { api_provider: string | null } | null)?.api_provider;
  if (apiProvider !== "dhl") return false;

  const isStale =
    !shipment.last_api_sync_at || Date.now() - new Date(shipment.last_api_sync_at).getTime() > STALE_AFTER_MS;
  if (!isStale) return false;

  try {
    const result = await syncDhlShipment(shipmentId, shipment.tracking_number);
    return result.ok;
  } catch {
    return false;
  }
}

/** Admin-facing manual refresh button. */
export async function refreshShipmentFromApi(shipmentId: string): Promise<SyncResult> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("tracking_number, carrier_id, carriers(api_provider)")
    .eq("id", shipmentId)
    .maybeSingle();
  if (error || !shipment) return { ok: false, message: "Shipment not found." };

  const apiProvider = (shipment.carriers as unknown as { api_provider: string | null } | null)?.api_provider;
  if (apiProvider !== "dhl") {
    return { ok: false, message: "This shipment's carrier isn't linked to a tracking API." };
  }

  const result = await syncDhlShipment(shipmentId, shipment.tracking_number);
  revalidatePath("/admin/shipments");
  revalidatePath(`/admin/shipments/${shipmentId}`);
  return result;
}
