"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { notifyNewSupplierReview } from "@/lib/notify";
import type { SupplierReview } from "@/lib/supabase/types";

export interface SupplierReviewInput {
  supplierId: string;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
  turnstileToken: string;
}

export async function submitSupplierReview(
  input: SupplierReviewInput
): Promise<{ success: boolean; error?: string }> {
  if (!input.reviewerName.trim() || !input.reviewerEmail.trim() || !input.reviewerEmail.includes("@")) {
    return { success: false, error: "Your name and a valid email are required." };
  }
  if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Pick a rating from 1 to 5 stars." };
  }

  // Same x-forwarded-for reasoning as every other public form in this
  // codebase — the last hop is appended by our own reverse proxy and
  // can't be spoofed by the client.
  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `supplier-review:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many submissions. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const captchaOk = await verifyTurnstileToken(input.turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
  }

  const supabase = getSupabasePublicClient();
  const { data: supplier } = await supabase
    .from("suppliers")
    .select("id")
    .eq("id", input.supplierId)
    .eq("status", "approved")
    .maybeSingle();
  if (!supplier) {
    return { success: false, error: "We couldn't find that supplier." };
  }

  const { error } = await supabase.from("supplier_reviews").insert({
    supplier_id: input.supplierId,
    reviewer_name: input.reviewerName.trim(),
    reviewer_email: input.reviewerEmail.trim(),
    rating: input.rating,
    comment: input.comment.trim() || null,
  });

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  await notifyNewSupplierReview({
    reviewerName: input.reviewerName.trim(),
    rating: input.rating,
    comment: input.comment.trim() || null,
  });

  return { success: true };
}

export interface SupplierReviewSummary {
  reviews: SupplierReview[];
  average: number | null;
  count: number;
}

/** Public read — only ever returns approved reviews. Used by the
 * supplier's own public profile page. */
export async function getApprovedReviewsForSupplier(supplierId: string): Promise<SupplierReviewSummary> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_reviews")
    .select("*")
    .eq("supplier_id", supplierId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error || !data) return { reviews: [], average: null, count: 0 };

  const reviews = data as SupplierReview[];
  const average = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : null;

  return { reviews, average, count: reviews.length };
}

function revalidateReviewPaths(supplierId?: string) {
  revalidatePath("/admin/reviews");
  if (supplierId) {
    for (const locale of ["en", "zh", "ru"]) {
      revalidatePath(`/${locale}/suppliers/${supplierId}`);
    }
  }
}

export interface AdminSupplierReview extends SupplierReview {
  supplier_company_name: string;
}

export async function getAllReviews(): Promise<AdminSupplierReview[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_reviews")
    .select("*, suppliers(company_name)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return (data as (SupplierReview & { suppliers: { company_name: string } | null })[]).map((r) => ({
    ...r,
    supplier_company_name: r.suppliers?.company_name ?? "Unknown supplier",
  }));
}

export async function updateReviewStatus(id: string, status: SupplierReview["status"]): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_reviews")
    .update({ status })
    .eq("id", id)
    .select("supplier_id")
    .single();

  if (error) throw new Error(error.message);
  revalidateReviewPaths(data?.supplier_id);
}

export async function deleteReview(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("supplier_reviews").select("supplier_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("supplier_reviews").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateReviewPaths(data?.supplier_id);
}

/** Lightweight count for the admin top bar's notification badge. */
export async function getPendingReviewCount(): Promise<number> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("supplier_reviews")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return count ?? 0;
}
