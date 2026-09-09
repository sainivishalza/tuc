"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { notifyNewQuoteRequest } from "@/lib/notify";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { QuoteRequest } from "@/lib/supabase/types";

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
