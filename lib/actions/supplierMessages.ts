"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { requireSupplierEmailAction } from "@/lib/supplierAuth";
import { notifyAdminNewSupplierMessage, notifySupplierNewMessage } from "@/lib/notify";
import type { SupplierMessage } from "@/lib/supabase/types";

async function resolveOwnSupplier(): Promise<{ id: string; email: string; company_name: string }> {
  const email = await requireSupplierEmailAction();
  const supabase = getSupabaseAdminClient();
  const { data: supplier } = await supabase.from("suppliers").select("id, email, company_name").ilike("email", email).maybeSingle();
  if (!supplier) throw new Error("We couldn't find your supplier account.");
  return supplier as { id: string; email: string; company_name: string };
}

// ---------- Admin side ----------

export async function getMessagesForSupplier(supplierId: string): Promise<SupplierMessage[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_messages")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as SupplierMessage[];
}

export async function sendMessageAsAdmin(supplierId: string, body: string): Promise<void> {
  await requireAdminAction();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message can't be empty.");

  const supabase = getSupabaseAdminClient();
  const { data: supplier } = await supabase.from("suppliers").select("email, company_name").eq("id", supplierId).maybeSingle();
  if (!supplier) throw new Error("Supplier not found.");

  const { error } = await supabase
    .from("supplier_messages")
    .insert({ supplier_id: supplierId, sender: "admin", body: trimmed, read_by_admin: true, read_by_supplier: false });
  if (error) throw new Error(error.message);

  await notifySupplierNewMessage({ supplierEmail: supplier.email as string, companyName: supplier.company_name as string });
  revalidatePath(`/admin/suppliers/${supplierId}`);
}

export async function markMessagesReadByAdmin(supplierId: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("supplier_messages")
    .update({ read_by_admin: true })
    .eq("supplier_id", supplierId)
    .eq("sender", "supplier")
    .eq("read_by_admin", false);
  if (error) throw new Error(error.message);
}

/** Lightweight count for the admin top bar's notification badge — every
 * supplier-sent message staff hasn't opened yet, regardless of which
 * supplier it's from. */
export async function getUnreadAdminMessageCount(): Promise<number> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("supplier_messages")
    .select("*", { count: "exact", head: true })
    .eq("sender", "supplier")
    .eq("read_by_admin", false);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ---------- Supplier portal side ----------

export async function getMyMessages(): Promise<SupplierMessage[]> {
  const supplier = await resolveOwnSupplier();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_messages")
    .select("*")
    .eq("supplier_id", supplier.id)
    .order("created_at", { ascending: true });
  if (error) return [];
  return data as SupplierMessage[];
}

export async function sendMessageAsSupplier(body: string): Promise<void> {
  const supplier = await resolveOwnSupplier();
  const trimmed = body.trim();
  if (!trimmed) throw new Error("Message can't be empty.");

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("supplier_messages")
    .insert({ supplier_id: supplier.id, sender: "supplier", body: trimmed, read_by_admin: false, read_by_supplier: true });
  if (error) throw new Error(error.message);

  await notifyAdminNewSupplierMessage({ companyName: supplier.company_name });
  revalidatePath("/supplier-portal/messages");
}

export async function markMessagesReadBySupplier(): Promise<void> {
  const supplier = await resolveOwnSupplier();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("supplier_messages")
    .update({ read_by_supplier: true })
    .eq("supplier_id", supplier.id)
    .eq("sender", "admin")
    .eq("read_by_supplier", false);
  if (error) throw new Error(error.message);
}

export async function getMyUnreadMessageCount(): Promise<number> {
  const supplier = await resolveOwnSupplier();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("supplier_messages")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", supplier.id)
    .eq("sender", "admin")
    .eq("read_by_supplier", false);
  if (error) return 0;
  return count ?? 0;
}
