"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { Carrier } from "@/lib/supabase/types";

export async function getAllCarriers(): Promise<Carrier[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data as Carrier[];
}

export async function getCarrierById(id: string): Promise<Carrier | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("carriers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Carrier | null;
}

export interface CarrierInput {
  name: string;
  website_url: string | null;
  notes: string | null;
}

export async function createCarrier(input: CarrierInput): Promise<void> {
  await requireAdminAction();
  if (!input.name.trim()) throw new Error("Carrier name is required.");
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("carriers").insert({
    name: input.name.trim(),
    website_url: input.website_url?.trim() || null,
    notes: input.notes?.trim() || null,
  });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/carriers");
}

export async function updateCarrier(id: string, input: CarrierInput): Promise<void> {
  await requireAdminAction();
  if (!input.name.trim()) throw new Error("Carrier name is required.");
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("carriers")
    .update({
      name: input.name.trim(),
      website_url: input.website_url?.trim() || null,
      notes: input.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/carriers");
}

export async function deleteCarrier(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("carriers").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/carriers");
}
