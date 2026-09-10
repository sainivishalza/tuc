"use server";

import { headers } from "next/headers";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import type { NewsletterSubscriber } from "@/lib/supabase/types";

export interface SubscribeInput {
  email: string;
  source: NewsletterSubscriber["source"];
  locale: string;
  turnstileToken: string;
}

export async function subscribe(
  input: SubscribeInput
): Promise<{ success: boolean; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return { success: false, error: "Enter a valid email address." };
  }

  // Own rate-limit bucket, separate from the quote form's — a newsletter
  // signup is much lower-stakes (no email sent, no admin alert) but still
  // worth capping against scripted spam filling the table.
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `newsletter:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 10, windowMs: 15 * 60 * 1000 });

  const captchaOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
  }

  const supabase = getSupabasePublicClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email, source: input.source, locale: input.locale });

  // 23505 = unique_violation (already subscribed with this email + source).
  // Deliberately a plain insert rather than an upsert — an upsert's
  // conflict detection needs a SELECT RLS policy to check existing rows,
  // which would mean letting anyone read every subscriber's email. Re-
  // subscribing isn't an error from the visitor's side either way, so
  // this still reports success.
  if (error && error.code !== "23505") {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  return { success: true };
}

export async function getNewsletterSubscribers(): Promise<NewsletterSubscriber[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as NewsletterSubscriber[];
}
