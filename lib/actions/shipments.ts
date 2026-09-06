"use server";

import { revalidatePath } from "next/cache";
import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { Shipment, PublicShipment, ShipmentStatus } from "@/lib/supabase/types";

const BUCKET = "packing-lists";

// ---------- Public tracking ----------

export async function trackShipment(trackingNumber: string): Promise<PublicShipment | null> {
  const cleaned = trackingNumber.trim();
  if (!cleaned) return null;

  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("shipments_public")
    .select("*")
    .eq("tracking_number", cleaned)
    .maybeSingle();

  if (error || !data) return null;
  return data as PublicShipment;
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

// ---------- Admin CRUD ----------

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

export interface ShipmentInput {
  tracking_number: string;
  carrier_id: string | null;
  customer_name: string | null;
  customer_reference: string | null;
  destination_country: string | null;
  total_pieces: number | null;
  current_location: string | null;
  status: ShipmentStatus;
  latest_update: string | null;
  latest_update_at: string | null;
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
      destination_country: input.destination_country?.trim() || null,
      total_pieces: input.total_pieces,
      current_location: input.current_location?.trim() || null,
      status: input.status,
      latest_update: input.latest_update?.trim() || null,
      latest_update_at: input.latest_update_at || null,
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
  const { error } = await supabase
    .from("shipments")
    .update({
      tracking_number: input.tracking_number.trim(),
      carrier_id: input.carrier_id,
      customer_name: input.customer_name?.trim() || null,
      customer_reference: input.customer_reference?.trim() || null,
      destination_country: input.destination_country?.trim() || null,
      total_pieces: input.total_pieces,
      current_location: input.current_location?.trim() || null,
      status: input.status,
      latest_update: input.latest_update?.trim() || null,
      latest_update_at: input.latest_update_at || null,
      visible: input.visible,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateShipmentPaths();
}

export async function deleteShipment(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: shipment } = await supabase
    .from("shipments")
    .select("packing_list_excel_path, packing_list_pdf_path")
    .eq("id", id)
    .maybeSingle();

  const paths = [shipment?.packing_list_excel_path, shipment?.packing_list_pdf_path].filter(
    (p): p is string => !!p
  );
  if (paths.length > 0) {
    await supabase.storage.from(BUCKET).remove(paths);
  }

  const { error } = await supabase.from("shipments").delete().eq("id", id);
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
      cells.push(cell.text ?? "");
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
  const rows = await excelBufferToRows(arrayBuffer);
  const pdfBuffer = await rowsToPdfBuffer(rows, `Packing List — ${shipment.tracking_number}`);

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
