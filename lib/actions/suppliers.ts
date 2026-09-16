"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { notifyNewSupplierRegistration } from "@/lib/notify";
import { BUCKET, validateAndUploadFile, IMAGE_TYPES, LICENSE_TYPES } from "@/lib/supplierFileUpload";
import type { Supplier } from "@/lib/supabase/types";

export async function submitSupplierRegistration(
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const companyName = String(formData.get("company_name") ?? "").trim();
  const contactName = String(formData.get("contact_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!companyName || !contactName || !email || !email.includes("@")) {
    return { success: false, error: "Company name, contact name, and a valid email are required." };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `supplier-register:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many attempts. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
  }

  const pathPrefix = `suppliers/${crypto.randomUUID()}`;

  const licenseResult = await validateAndUploadFile(formData, "business_license", LICENSE_TYPES, pathPrefix);
  if (licenseResult && !licenseResult.ok) return { success: false, error: licenseResult.message };

  const cardResult = await validateAndUploadFile(formData, "visiting_card", IMAGE_TYPES, pathPrefix);
  if (cardResult && !cardResult.ok) return { success: false, error: cardResult.message };

  const photoResult = await validateAndUploadFile(formData, "company_photo", IMAGE_TYPES, pathPrefix);
  if (photoResult && !photoResult.ok) return { success: false, error: photoResult.message };

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("suppliers").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: String(formData.get("phone") ?? "").trim() || null,
    product_categories: String(formData.get("product_categories") ?? "").trim() || null,
    business_address: String(formData.get("business_address") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    business_license_url: licenseResult?.ok ? licenseResult.url : null,
    visiting_card_url: cardResult?.ok ? cardResult.url : null,
    company_photo_url: photoResult?.ok ? photoResult.url : null,
    status: "pending",
  });

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  await notifyNewSupplierRegistration({ companyName, contactName, email });

  return { success: true };
}

export async function getApprovedSuppliers(): Promise<
  Pick<Supplier, "id" | "company_name" | "product_categories" | "company_photo_url" | "business_license_url" | "visiting_card_url">[]
> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, company_name, product_categories, company_photo_url, business_license_url, visiting_card_url")
    .eq("status", "approved")
    .order("company_name", { ascending: true });

  if (error) return [];
  return data as Supplier[];
}

/** Lightweight count for the top bar's notification badge. */
export async function getPendingSupplierCount(): Promise<number> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("suppliers")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getAllSuppliers(): Promise<Supplier[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Supplier[];
}

export async function getSupplierById(id: string): Promise<Supplier | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as Supplier | null;
}

function revalidateSupplierPaths() {
  revalidatePath("/admin/suppliers");
  revalidatePath("/en/suppliers");
  revalidatePath("/zh/suppliers");
  revalidatePath("/ru/suppliers");
}

export async function updateSupplierStatus(id: string, status: Supplier["status"]): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateSupplierPaths();
}

/** Quick inline rating from the directory grid, separate from the full
 * edit form — a 1-5 star click shouldn't require a page navigation. */
export async function updateSupplierRating(id: string, rating: number | null): Promise<void> {
  await requireAdminAction();
  if (rating !== null && (rating < 1 || rating > 5)) {
    throw new Error("Rating must be between 1 and 5.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("suppliers")
    .update({ rating, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateSupplierPaths();
}

export interface SupplierEditInput {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  product_categories: string;
  business_address: string;
  country: string;
  rating: number | null;
  notes: string;
  admin_notes: string;
  status: Supplier["status"];
}

export async function updateSupplier(id: string, input: SupplierEditInput, formData?: FormData): Promise<void> {
  await requireAdminAction();
  if (!input.company_name.trim() || !input.contact_name.trim()) {
    throw new Error("Company name and contact name are required.");
  }

  const pathPrefix = `suppliers/${id}`;
  const update: Record<string, unknown> = {
    company_name: input.company_name.trim(),
    contact_name: input.contact_name.trim(),
    email: input.email.trim(),
    phone: input.phone.trim() || null,
    product_categories: input.product_categories.trim() || null,
    business_address: input.business_address.trim() || null,
    country: input.country.trim() || null,
    rating: input.rating,
    notes: input.notes.trim() || null,
    admin_notes: input.admin_notes.trim() || null,
    status: input.status,
    updated_at: new Date().toISOString(),
  };

  if (formData) {
    const licenseResult = await validateAndUploadFile(formData, "business_license", LICENSE_TYPES, pathPrefix);
    if (licenseResult) {
      if (!licenseResult.ok) throw new Error(licenseResult.message);
      update.business_license_url = licenseResult.url;
    }
    const cardResult = await validateAndUploadFile(formData, "visiting_card", IMAGE_TYPES, pathPrefix);
    if (cardResult) {
      if (!cardResult.ok) throw new Error(cardResult.message);
      update.visiting_card_url = cardResult.url;
    }
    const photoResult = await validateAndUploadFile(formData, "company_photo", IMAGE_TYPES, pathPrefix);
    if (photoResult) {
      if (!photoResult.ok) throw new Error(photoResult.message);
      update.company_photo_url = photoResult.url;
    }
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("suppliers").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateSupplierPaths();
}

export async function deleteSupplier(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("business_license_url, visiting_card_url, company_photo_url")
    .eq("id", id)
    .maybeSingle();

  if (supplier) {
    const paths = [supplier.business_license_url, supplier.visiting_card_url, supplier.company_photo_url]
      .filter((url): url is string => !!url)
      .map((url) => url.split(`${BUCKET}/`)[1])
      .filter((p): p is string => !!p);
    if (paths.length > 0) {
      await supabase.storage.from(BUCKET).remove(paths);
    }
  }

  const { error } = await supabase.from("suppliers").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateSupplierPaths();
}
