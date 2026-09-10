"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { notifyNewQuoteRequest, notifyNewBulkQuoteRequest } from "@/lib/notify";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { QuoteRequest, QuoteLineItem } from "@/lib/supabase/types";

export interface QuoteRequestInput {
  name: string;
  email: string;
  whatsapp: string;
  product: string;
  quantity: string;
  timeline: string;
  message: string;
  /** Empty string when Turnstile isn't configured (NEXT_PUBLIC_TURNSTILE_SITE_KEY
   * unset) or not yet solved — verifyTurnstileToken handles both cases. */
  turnstileToken: string;
}

export async function submitQuoteRequest(
  input: QuoteRequestInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Name and email are required." };
  }

  // Same x-forwarded-for reasoning as the admin login / portal-link rate
  // limits — the last hop is appended by our own reverse proxy and can't
  // be spoofed by the client. Without this, the form had no limit at all:
  // scriptable, unlimited submissions each firing a real email through
  // Resend and filling the admin's quote-requests table.
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `quote:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const captchaOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
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

  await notifyNewQuoteRequest({
    name: input.name.trim(),
    email: input.email.trim(),
    whatsapp: input.whatsapp.trim() || null,
    product: input.product.trim() || null,
    quantity: input.quantity.trim() || null,
    timeline: input.timeline.trim() || null,
    message: input.message.trim() || null,
  });

  return { success: true };
}

const MAX_BULK_ITEMS = 200;

export interface BulkQuoteRequestInput {
  name: string;
  email: string;
  whatsapp: string;
  timeline: string;
  message: string;
  items: QuoteLineItem[];
  turnstileToken: string;
}

export async function submitBulkQuoteRequest(
  input: BulkQuoteRequestInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.name.trim() || !input.email.trim()) {
    return { success: false, error: "Name and email are required." };
  }
  const items = input.items
    .map((item) => ({
      product: item.product.trim().slice(0, 500),
      quantity: item.quantity.trim().slice(0, 100),
      notes: item.notes.trim().slice(0, 500),
    }))
    .filter((item) => item.product !== "");

  if (items.length === 0) {
    return { success: false, error: "Add at least one line item with a product." };
  }
  if (items.length > MAX_BULK_ITEMS) {
    return { success: false, error: `Please limit a single request to ${MAX_BULK_ITEMS} line items.` };
  }

  // Shares the same rate-limit bucket as the single-product quote form —
  // otherwise a submitter could bypass the per-IP limit just by switching
  // forms.
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `quote:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const captchaOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
  }

  const supabase = getSupabasePublicClient();
  const { error } = await supabase.from("quote_requests").insert({
    name: input.name.trim(),
    email: input.email.trim(),
    whatsapp: input.whatsapp.trim() || null,
    product: `Bulk request — ${items.length} item${items.length === 1 ? "" : "s"}`,
    quantity: null,
    timeline: input.timeline.trim() || null,
    message: input.message.trim() || null,
    items,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  await notifyNewBulkQuoteRequest({
    name: input.name.trim(),
    email: input.email.trim(),
    whatsapp: input.whatsapp.trim() || null,
    timeline: input.timeline.trim() || null,
    message: input.message.trim() || null,
    items,
  });

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
