"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { autoSyncIfStale } from "@/lib/actions/dhlSync";
import { notifyStatusChange, notifyNewUpdate } from "@/lib/notify";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import type { Shipment, PublicShipment, ShipmentStatus, ShipmentEvent } from "@/lib/supabase/types";

const BUCKET = "packing-lists";

// ---------- Public tracking ----------

/** Shared by both public lookup entry points below (single and batch) so
 * an attacker can't dodge the limit by alternating between them. Tracking
 * numbers are looked up by exact match only (no enumeration via wildcards),
 * but without a throttle a script could still brute-force the sequential
 * numeric suffix these tracking numbers use — this bounds that to a few
 * hundred guesses per 5 minutes per IP instead of unlimited. */
async function checkTrackingRateLimit(): Promise<{ allowed: boolean; retryAfterMs?: number }> {
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const key = `track:${ip}`;
  const limit = await checkRateLimit(key);
  if (limit.allowed) {
    await recordFailedAttempt(key, { maxAttempts: 15, windowMs: 5 * 60 * 1000 });
  }
  return limit;
}

export async function trackShipment(trackingNumber: string): Promise<PublicShipment | null> {
  const cleaned = trackingNumber.trim();
  if (!cleaned) return null;

  const { allowed } = await checkTrackingRateLimit();
  if (!allowed) return null;

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_public_shipment", { p_tracking_number: cleaned });

  if (error || !data || data.length === 0) return null;
  let shipment = data[0] as PublicShipment;

  if (shipment.carrier_api_provider === "dhl") {
    const synced = await autoSyncIfStale(shipment.id);
    if (synced) {
      const { data: refreshed } = await supabase.rpc("get_public_shipment", { p_tracking_number: cleaned });
      if (refreshed && refreshed.length > 0) shipment = refreshed[0] as PublicShipment;
    }
  }

  return shipment;
}

export interface TrackedShipmentResult {
  trackingNumber: string;
  shipment: PublicShipment | null;
  events: ShipmentEvent[];
}

const MAX_BATCH_TRACKING_NUMBERS = 20;

/** Batch lookup for the "track multiple parcels at once" flow — accepts
 * numbers separated by commas, spaces, or newlines. */
export async function trackShipments(rawInput: string): Promise<TrackedShipmentResult[]> {
  const seen = new Set<string>();
  const trackingNumbers = rawInput
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter((s) => {
      if (!s || seen.has(s)) return false;
      seen.add(s);
      return true;
    })
    .slice(0, MAX_BATCH_TRACKING_NUMBERS);

  if (trackingNumbers.length === 0) return [];

  const { allowed } = await checkTrackingRateLimit();
  if (!allowed) {
    return trackingNumbers.map((trackingNumber) => ({ trackingNumber, shipment: null, events: [] }));
  }

  const supabase = getSupabasePublicClient();
  const fetchShipments = () =>
    supabase.rpc("get_public_shipments", { p_tracking_numbers: trackingNumbers });

  const first = await fetchShipments();
  let shipments = first.data;
  if (first.error || !shipments) {
    return trackingNumbers.map((trackingNumber) => ({ trackingNumber, shipment: null, events: [] }));
  }

  const dhlLinked = (shipments as PublicShipment[]).filter((s) => s.carrier_api_provider === "dhl");
  if (dhlLinked.length > 0) {
    const syncedFlags = await Promise.all(
      dhlLinked.map((s) => autoSyncIfStale(s.id))
    );
    if (syncedFlags.some(Boolean)) {
      const refetched = await fetchShipments();
      if (!refetched.error && refetched.data) shipments = refetched.data;
    }
  }

  const byTrackingNumber = new Map((shipments as PublicShipment[]).map((s) => [s.tracking_number, s]));
  const shipmentIds = (shipments as PublicShipment[]).map((s) => s.id);

  let eventsByShipmentId = new Map<string, ShipmentEvent[]>();
  if (shipmentIds.length > 0) {
    const { data: events } = await supabase.rpc("get_public_shipment_events", {
      p_shipment_ids: shipmentIds,
    });

    eventsByShipmentId = (events as ShipmentEvent[] | null ?? []).reduce((map, ev) => {
      const list = map.get(ev.shipment_id) ?? [];
      list.push(ev);
      map.set(ev.shipment_id, list);
      return map;
    }, new Map<string, ShipmentEvent[]>());
  }

  return trackingNumbers.map((trackingNumber) => {
    const shipment = byTrackingNumber.get(trackingNumber) ?? null;
    return {
      trackingNumber,
      shipment,
      events: shipment ? eventsByShipmentId.get(shipment.id) ?? [] : [],
    };
  });
}

/** Chronological event log for a shipment — public because the row is only
 * reachable via a tracking-number lookup that already scopes to visible
 * shipments (see the shipment_events RLS policy). */
export async function getPublicShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase.rpc("get_public_shipment_events", {
    p_shipment_ids: [shipmentId],
  });

  if (error || !data) return [];
  return data as ShipmentEvent[];
}

/**
 * Possessing the tracking number is the authorization here, the same
 * model as any courier's tracking page — the admin client is only used
 * internally to resolve the private storage path and mint a
 * short-lived signed URL; the path itself is never exposed.
 */
export async function getPackingListUrl(
  trackingNumber: string,
  format: "excel" | "pdf"
): Promise<string | null> {
  const cleaned = trackingNumber.trim();
  if (!cleaned) return null;

  const { allowed } = await checkTrackingRateLimit();
  if (!allowed) return null;

  const supabase = getSupabaseAdminClient();
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("packing_list_excel_path, packing_list_pdf_path, visible")
    .eq("tracking_number", cleaned)
    .maybeSingle();

  if (error || !shipment || !shipment.visible) return null;

  const path = format === "excel" ? shipment.packing_list_excel_path : shipment.packing_list_pdf_path;
  if (!path) return null;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, 300);

  if (signError || !signed) return null;
  return signed.signedUrl;
}

/** Same authorization model as getPackingListUrl — the tracking number itself is the key. */
export async function getProofOfDeliveryUrl(trackingNumber: string): Promise<string | null> {
  const cleaned = trackingNumber.trim();
  if (!cleaned) return null;

  const { allowed } = await checkTrackingRateLimit();
  if (!allowed) return null;

  const supabase = getSupabaseAdminClient();
  const { data: shipment, error } = await supabase
    .from("shipments")
    .select("pod_file_path, visible")
    .eq("tracking_number", cleaned)
    .maybeSingle();

  if (error || !shipment || !shipment.visible || !shipment.pod_file_path) return null;

  const { data: signed, error: signError } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(shipment.pod_file_path, 300);

  if (signError || !signed) return null;
  return signed.signedUrl;
}

// ---------- Admin CRUD ----------

/** Real counts for the dashboard's KPI cards — head-only queries rather
 * than fetching every shipment row just to count them. "In transit"
 * covers everything actually moving; "inspections pending" is production
 * finished but QC not yet passed. */
export async function getShipmentKpiCounts(): Promise<{ inTransit: number; inspectionsPending: number }> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const [inTransitRes, inspectionsRes] = await Promise.all([
    supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .in("status", ["ready_to_ship", "in_transit", "delayed"]),
    supabase
      .from("shipments")
      .select("*", { count: "exact", head: true })
      .not("milestone_production_started_at", "is", null)
      .is("milestone_qc_passed_at", null),
  ]);

  if (inTransitRes.error) throw new Error(inTransitRes.error.message);
  if (inspectionsRes.error) throw new Error(inspectionsRes.error.message);

  return { inTransit: inTransitRes.count ?? 0, inspectionsPending: inspectionsRes.count ?? 0 };
}

export async function getAllShipments(): Promise<Shipment[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Shipment[];
}

export async function getShipmentById(id: string): Promise<Shipment | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Shipment | null;
}

/** The milestone field each status implies has been reached — backfilled
 * with now() only if not already set, so the Kanban board's "advance"
 * action keeps the shipment's own milestone timeline accurate instead of
 * just flipping a status label with nothing behind it. */
const MILESTONE_FOR_STATUS: Partial<Record<ShipmentStatus, keyof Shipment>> = {
  // Re-applying "not_shipped" (the Kanban board's Sourcing -> Sample
  // Approved move, which has no status of its own) backfills this
  // milestone without needing a status change.
  not_shipped: "milestone_sample_approved_at",
  in_production: "milestone_production_started_at",
  // Reaching ready_to_ship is what implies QC passed — quality_check
  // itself has no "entered inspection" milestone of its own in this
  // schema, only the eventual pass/fail via leaving it.
  ready_to_ship: "milestone_qc_passed_at",
  in_transit: "milestone_shipped_at",
  delivered: "milestone_delivered_at",
};

/** Status-only update for the Kanban board's per-card "advance" action —
 * a lightweight alternative to updateShipment's full-form payload for the
 * one-field change a drag/click between columns actually makes. */
export async function updateShipmentStatus(id: string, status: ShipmentStatus): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase
    .from("shipments")
    .select("status, customer_email, tracking_number, milestone_sample_approved_at")
    .eq("id", id)
    .maybeSingle();
  if (!existing) throw new Error("Shipment not found.");
  const statusChanged = existing.status !== status;

  const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
  const milestoneField = MILESTONE_FOR_STATUS[status];
  if (milestoneField && !existing[milestoneField as keyof typeof existing]) {
    update[milestoneField] = new Date().toISOString();
  }

  const { error } = await supabase.from("shipments").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  if (statusChanged && existing.customer_email) {
    await notifyStatusChange({
      customerEmail: existing.customer_email,
      trackingNumber: existing.tracking_number,
      newStatus: status,
    });
  }

  revalidateShipmentPaths();
  revalidatePath("/admin");
}

export interface ShipmentInput {
  tracking_number: string;
  carrier_id: string | null;
  customer_name: string | null;
  customer_reference: string | null;
  customer_email: string | null;
  carrier_reference_no: string | null;
  recipient_postal_code: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  milestone_deposit_paid_at: string | null;
  milestone_sample_approved_at: string | null;
  milestone_production_started_at: string | null;
  milestone_qc_passed_at: string | null;
  milestone_ready_to_ship_at: string | null;
  milestone_received_at: string | null;
  milestone_shipped_at: string | null;
  milestone_departed_at: string | null;
  milestone_arrived_at: string | null;
  milestone_out_for_delivery_at: string | null;
  milestone_delivered_at: string | null;
  visible: boolean;
}

function revalidateShipmentPaths() {
  revalidatePath("/admin/shipments");
}

export async function createShipment(input: ShipmentInput): Promise<string> {
  await requireAdminAction();
  if (!input.tracking_number.trim()) throw new Error("Tracking number is required.");
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipments")
    .insert({
      tracking_number: input.tracking_number.trim(),
      carrier_id: input.carrier_id,
      customer_name: input.customer_name?.trim() || null,
      customer_reference: input.customer_reference?.trim() || null,
      customer_email: input.customer_email?.trim() || null,
      carrier_reference_no: input.carrier_reference_no?.trim() || null,
      recipient_postal_code: input.recipient_postal_code?.trim() || null,
      destination_country: input.destination_country?.trim() || null,
      total_pieces: input.total_pieces,
      current_location: input.current_location?.trim() || null,
      status: input.status,
      milestone_deposit_paid_at: input.milestone_deposit_paid_at || null,
      milestone_sample_approved_at: input.milestone_sample_approved_at || null,
      milestone_production_started_at: input.milestone_production_started_at || null,
      milestone_qc_passed_at: input.milestone_qc_passed_at || null,
      milestone_ready_to_ship_at: input.milestone_ready_to_ship_at || null,
      milestone_received_at: input.milestone_received_at || null,
      milestone_shipped_at: input.milestone_shipped_at || null,
      milestone_departed_at: input.milestone_departed_at || null,
      milestone_arrived_at: input.milestone_arrived_at || null,
      milestone_out_for_delivery_at: input.milestone_out_for_delivery_at || null,
      milestone_delivered_at: input.milestone_delivered_at || null,
      visible: input.visible,
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
  return data.id as string;
}

export async function updateShipment(id: string, input: ShipmentInput): Promise<void> {
  await requireAdminAction();
  if (!input.tracking_number.trim()) throw new Error("Tracking number is required.");
  const supabase = getSupabaseAdminClient();

  const { data: existing } = await supabase.from("shipments").select("status").eq("id", id).maybeSingle();
  const statusChanged = existing && existing.status !== input.status;

  const { error } = await supabase
    .from("shipments")
    .update({
      tracking_number: input.tracking_number.trim(),
      carrier_id: input.carrier_id,
      customer_name: input.customer_name?.trim() || null,
      customer_reference: input.customer_reference?.trim() || null,
      customer_email: input.customer_email?.trim() || null,
      carrier_reference_no: input.carrier_reference_no?.trim() || null,
      recipient_postal_code: input.recipient_postal_code?.trim() || null,
      destination_country: input.destination_country?.trim() || null,
      total_pieces: input.total_pieces,
      current_location: input.current_location?.trim() || null,
      status: input.status,
      milestone_deposit_paid_at: input.milestone_deposit_paid_at || null,
      milestone_sample_approved_at: input.milestone_sample_approved_at || null,
      milestone_production_started_at: input.milestone_production_started_at || null,
      milestone_qc_passed_at: input.milestone_qc_passed_at || null,
      milestone_ready_to_ship_at: input.milestone_ready_to_ship_at || null,
      milestone_received_at: input.milestone_received_at || null,
      milestone_shipped_at: input.milestone_shipped_at || null,
      milestone_departed_at: input.milestone_departed_at || null,
      milestone_arrived_at: input.milestone_arrived_at || null,
      milestone_out_for_delivery_at: input.milestone_out_for_delivery_at || null,
      milestone_delivered_at: input.milestone_delivered_at || null,
      visible: input.visible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);

  const customerEmail = input.customer_email?.trim();
  if (statusChanged && customerEmail) {
    await notifyStatusChange({
      customerEmail,
      trackingNumber: input.tracking_number.trim(),
      newStatus: input.status,
    });
  }

  revalidateShipmentPaths();
}

export async function deleteShipment(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("packing_list_excel_path, packing_list_pdf_path, pod_file_path")
    .eq("id", id)
    .maybeSingle();

  const paths = [
    shipment?.packing_list_excel_path,
    shipment?.packing_list_pdf_path,
    shipment?.pod_file_path,
  ].filter((p): p is string => !!p);
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("shipments").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
}

// ---------- Admin: shipment event log ----------

export async function getShipmentEvents(shipmentId: string): Promise<ShipmentEvent[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipment_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("event_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ShipmentEvent[];
}

export async function addShipmentEvent(
  shipmentId: string,
  eventAt: string,
  description: string
): Promise<void> {
  await requireAdminAction();
  if (!description.trim()) throw new Error("Description is required.");
  if (!eventAt) throw new Error("Event date/time is required.");
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("shipment_events").insert({
    shipment_id: shipmentId,
    event_at: eventAt,
    description: description.trim(),
  });

  if (error) throw new Error(error.message);

  const { data: shipment } = await supabase
    .from("shipments")
    .select("tracking_number, customer_email")
    .eq("id", shipmentId)
    .maybeSingle();
  if (shipment?.customer_email) {
    await notifyNewUpdate({
      customerEmail: shipment.customer_email,
      trackingNumber: shipment.tracking_number,
      description: description.trim(),
    });
  }

  revalidateShipmentPaths();
}

export async function deleteShipmentEvent(eventId: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("shipment_events").delete().eq("id", eventId);
  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
}

// ---------- Packing list upload + Excel -> PDF conversion ----------

async function excelBufferToRows(buffer: ArrayBuffer): Promise<string[][]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: string[][] = [];
  worksheet.eachRow((row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      // ExcelJS's `.text` getter throws on certain merged-cell layouts
      // (e.g. a photo column merged across rows) rather than returning an
      // empty string — a malformed merge shouldn't take down the whole
      // packing list upload over one unreadable cell.
      let text = "";
      try {
        text = cell.text ?? "";
      } catch {
        text = "";
      }
      cells.push(text);
    });
    rows.push(cells);
  });
  return rows;
}

function rowsToPdfBuffer(rows: string[][], title: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 36, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(16).text(title);
    doc.moveDown();

    if (rows.length === 0) {
      doc.fontSize(10).text("No data.");
      doc.end();
      return;
    }

    const colCount = Math.max(...rows.map((r) => r.length));
    const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
    const colWidth = pageWidth / colCount;
    const rowHeight = 20;
    let y = doc.y;

    doc.fontSize(9);
    for (let i = 0; i < rows.length; i++) {
      if (y + rowHeight > doc.page.height - doc.page.margins.bottom) {
        doc.addPage();
        y = doc.page.margins.top;
      }
      const row = rows[i];
      const isHeader = i === 0;
      let x = doc.page.margins.left;
      for (let c = 0; c < colCount; c++) {
        doc
          .font(isHeader ? "Helvetica-Bold" : "Helvetica")
          .text(row[c] ?? "", x + 2, y + 4, {
            width: colWidth - 4,
            height: rowHeight - 4,
            ellipsis: true,
          });
        x += colWidth;
      }
      doc
        .moveTo(doc.page.margins.left, y + rowHeight)
        .lineTo(doc.page.width - doc.page.margins.right, y + rowHeight)
        .strokeColor("#dddddd")
        .stroke();
      y += rowHeight;
    }

    doc.end();
  });
}

export async function uploadPackingList(shipmentId: string, file: File): Promise<void> {
  await requireAdminAction();
  if (!file || file.size === 0) throw new Error("No file provided.");

  const name = file.name.toLowerCase();
  const isExcel =
    file.type.includes("spreadsheet") || name.endsWith(".xlsx") || name.endsWith(".xls");
  if (!isExcel) {
    throw new Error("Packing list must be an Excel file (.xlsx or .xls).");
  }

  const supabase = getSupabaseAdminClient();
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("tracking_number")
    .eq("id", shipmentId)
    .maybeSingle();
  if (fetchError || !shipment) throw new Error("Shipment not found.");

  const arrayBuffer = await file.arrayBuffer();
  let rows: string[][];
  let pdfBuffer: Buffer;
  try {
    rows = await excelBufferToRows(arrayBuffer);
    pdfBuffer = await rowsToPdfBuffer(rows, `Packing List — ${shipment.tracking_number}`);
  } catch {
    throw new Error(
      "Couldn't read this Excel file — it may use a layout (merged cells, embedded objects) our converter doesn't handle. Try simplifying the sheet and re-uploading."
    );
  }

  const excelPath = `${shipmentId}/packing-list.xlsx`;
  const pdfPath = `${shipmentId}/packing-list.pdf`;

  const { error: excelUploadError } = await supabase.storage.from(BUCKET).upload(excelPath, arrayBuffer, {
    contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    upsert: true,
  });
  if (excelUploadError) throw new Error(excelUploadError.message);

  const { error: pdfUploadError } = await supabase.storage.from(BUCKET).upload(pdfPath, pdfBuffer, {
    contentType: "application/pdf",
    upsert: true,
  });
  if (pdfUploadError) throw new Error(pdfUploadError.message);

  const { error: updateError } = await supabase
    .from("shipments")
    .update({
      packing_list_excel_path: excelPath,
      packing_list_pdf_path: pdfPath,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);
  if (updateError) throw new Error(updateError.message);

  revalidateShipmentPaths();
}

export async function removePackingList(shipmentId: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("packing_list_excel_path, packing_list_pdf_path")
    .eq("id", shipmentId)
    .maybeSingle();

  const paths = [shipment?.packing_list_excel_path, shipment?.packing_list_pdf_path].filter(
    (p): p is string => !!p
  );
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("shipments")
    .update({
      packing_list_excel_path: null,
      packing_list_pdf_path: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", shipmentId);
  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
}

// ---------- Proof of delivery ----------

const POD_CONTENT_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function uploadProofOfDelivery(shipmentId: string, file: File): Promise<void> {
  await requireAdminAction();
  if (!file || file.size === 0) throw new Error("No file provided.");

  const ext = POD_CONTENT_TYPES[file.type];
  if (!ext) {
    throw new Error("Proof of delivery must be an image (JPG/PNG/WebP) or a PDF.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: shipment, error: fetchError } = await supabase
    .from("shipments")
    .select("pod_file_path")
    .eq("id", shipmentId)
    .maybeSingle();
  if (fetchError || !shipment) throw new Error("Shipment not found.");

  if (shipment.pod_file_path) {
    await supabase.storage.from(BUCKET).remove([shipment.pod_file_path]);
  }

  const path = `${shipmentId}/proof-of-delivery.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
    upsert: true,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { error: updateError } = await supabase
    .from("shipments")
    .update({ pod_file_path: path, updated_at: new Date().toISOString() })
    .eq("id", shipmentId);
  if (updateError) throw new Error(updateError.message);

  revalidateShipmentPaths();
}

export async function removeProofOfDelivery(shipmentId: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("pod_file_path")
    .eq("id", shipmentId)
    .maybeSingle();

  if (shipment?.pod_file_path) {
    await supabase.storage.from(BUCKET).remove([shipment.pod_file_path]);
  }

  const { error } = await supabase
    .from("shipments")
    .update({ pod_file_path: null, updated_at: new Date().toISOString() })
    .eq("id", shipmentId);
  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
}
