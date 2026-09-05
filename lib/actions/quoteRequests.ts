"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { QuoteRequest } from "@/lib/supabase/types";

export interface QuoteRequestInput {
  name: string;
  email: string;
  whatsapp: string;
  product: string;
  quantity: string;
  timeline: string;
  message: string;
}

export async function submitQuoteRequest(
  input: QuoteRequestInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Name and email are required." };
  }

  const supabase = getSupabasePublicClient();
  const { error } = await supabase.from("quote_requests").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    whatsapp: input.whatsapp.trim() || null,
    product: input.product.trim() || null,
    quantity: input.quantity.trim() || null,
    timeline: input.timeline.trim() || null,
    message: input.message.trim() || null,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

export async function getQuoteRequests(): Promise<QuoteRequest[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("quote_requests")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as QuoteRequest[];
}

export async function updateQuoteRequestStatus(
  id: string,
  status: QuoteRequest["status"]
): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("quote_requests")
    .update({ status })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/quote-requests");
}
