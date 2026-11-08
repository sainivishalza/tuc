"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { notifyNewSupplierRegistration, notifyReferralApproved } from "@/lib/notify";
import { BUCKET, validateAndUploadFile, processGalleryUpload, IMAGE_TYPES, LICENSE_TYPES } from "@/lib/supplierFileUpload";
import { parseCsv } from "@/lib/csv";
import type { Supplier } from "@/lib/supabase/types";

/** Replace-all sync, same simple pattern as a gallery's keep/add list —
 * this is what actually makes the category-match supplier-notification
 * email (in sourcingRequests.ts, around "justApproved") and the
 * supplier/admin matching UI below mean anything; supplier_categories
 * had no write path at all before this, so every category match query
 * against it was silently finding zero rows. */
export async function syncSupplierCategories(supplierId: string, categoryIds: string[]): Promise<void> {
  const supabase = getSupabaseAdminClient();
  await supabase.from("supplier_categories").delete().eq("supplier_id", supplierId);
  const unique = Array.from(new Set(categoryIds.filter(Boolean)));
  if (unique.length > 0) {
    await supabase.from("supplier_categories").insert(unique.map((category_id) => ({ supplier_id: supplierId, category_id })));
  }
}

export async function getSupplierCategoryIds(supplierId: string): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("supplier_categories").select("category_id").eq("supplier_id", supplierId);
  return (data ?? []).map((r) => r.category_id as string);
}

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

  const galleryResult = await processGalleryUpload(formData, pathPrefix);
  if (!galleryResult.ok) return { success: false, error: galleryResult.message };

  const supabase = getSupabaseAdminClient();

  // The referral link is just ?ref=<supplier id> on the public registration
  // page — validate it names a real, approved supplier rather than trusting
  // an arbitrary client-supplied id; any other value is silently dropped so
  // a bad or stale link never blocks registration.
  const referredBy = String(formData.get("referred_by") ?? "").trim();
  let referredBySupplierId: string | null = null;
  if (referredBy) {
    const { data: referrer } = await supabase.from("suppliers").select("id").eq("id", referredBy).eq("status", "approved").maybeSingle();
    if (referrer) referredBySupplierId = referrer.id as string;
  }

  const { error } = await supabase.from("suppliers").insert({
    company_name: companyName,
    contact_name: contactName,
    email,
    phone: String(formData.get("phone") ?? "").trim() || null,
    product_categories: String(formData.get("product_categories") ?? "").trim() || null,
    business_address: String(formData.get("business_address") ?? "").trim() || null,
    bio: String(formData.get("bio") ?? "").trim() || null,
    notes: String(formData.get("notes") ?? "").trim() || null,
    business_license_url: licenseResult?.ok ? licenseResult.url : null,
    visiting_card_url: cardResult?.ok ? cardResult.url : null,
    company_photo_url: photoResult?.ok ? photoResult.url : null,
    gallery_urls: galleryResult.urls,
    referred_by_supplier_id: referredBySupplierId,
    status: "pending",
  });

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  await notifyNewSupplierRegistration({ companyName, contactName, email });

  return { success: true };
}

export interface BulkSupplierImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

const VALID_TIERS: Supplier["tier"][] = ["standard", "gold", "premium"];
const VALID_STATUSES: Supplier["status"][] = ["pending", "approved", "rejected"];

/** Admin-only bulk onboarding, for seeding many already-known, real
 * suppliers at once instead of each one going through the public
 * registration form individually — same "CSV in, skip bad rows, report
 * counts" shape as bulkImportProducts. Deliberately skips the file-upload
 * fields entirely (business license, photos, gallery) for the same
 * reason the product importer skips "at least one photo required": a CSV
 * row can't carry a file. Status defaults to "pending" — the same review
 * gate the public form goes through — unless the row's own `status`
 * column says otherwise, so an admin importing suppliers they've already
 * vetted can mark them approved on the way in. */
export async function bulkImportSuppliers(csvText: string): Promise<BulkSupplierImportResult> {
  await requireAdminAction();
  const rows = parseCsv(csvText);
  if (rows.length < 2) {
    return { imported: 0, skipped: 0, errors: ["No data rows found — the first row must be a header."] };
  }

  const header = rows[0].map((h) => h.trim().toLowerCase());
  const col = (name: string) => header.indexOf(name);
  const companyCol = col("company_name");
  const contactCol = col("contact_name");
  const emailCol = col("email");
  if (companyCol === -1 || contactCol === -1 || emailCol === -1) {
    return { imported: 0, skipped: 0, errors: ['Missing one of the required columns: "company_name", "contact_name", "email".'] };
  }

  const get = (row: string[], name: string): string | undefined => {
    const j = col(name);
    return j === -1 ? undefined : row[j]?.trim();
  };

  const supabase = getSupabaseAdminClient();
  const { data: existingSuppliers } = await supabase.from("suppliers").select("email");
  const existingEmails = new Set((existingSuppliers ?? []).map((s) => (s.email as string).toLowerCase()));

  const records: Record<string, unknown>[] = [];
  const seenInBatch = new Set<string>();
  let skipped = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const companyName = row[companyCol]?.trim();
    const contactName = row[contactCol]?.trim();
    const email = row[emailCol]?.trim().toLowerCase();

    if (!companyName || !contactName || !email || !email.includes("@")) {
      skipped++;
      continue;
    }
    if (existingEmails.has(email) || seenInBatch.has(email)) {
      skipped++;
      continue;
    }
    seenInBatch.add(email);

    const tier = get(row, "tier")?.toLowerCase() as Supplier["tier"] | undefined;
    const status = get(row, "status")?.toLowerCase() as Supplier["status"] | undefined;

    records.push({
      company_name: companyName,
      contact_name: contactName,
      email,
      phone: get(row, "phone") || null,
      product_categories: get(row, "product_categories") || null,
      business_address: get(row, "business_address") || null,
      country: get(row, "country") || null,
      bio: get(row, "bio") || null,
      notes: get(row, "notes") || null,
      tier: tier && VALID_TIERS.includes(tier) ? tier : "standard",
      status: status && VALID_STATUSES.includes(status) ? status : "pending",
      gallery_urls: [],
    });
  }

  if (records.length === 0) {
    return { imported: 0, skipped, errors: ["No valid rows — every row needs company_name, contact_name, and a unique email."] };
  }

  const { error } = await supabase.from("suppliers").insert(records);
  if (error) {
    return { imported: 0, skipped, errors: [error.message] };
  }

  revalidateSupplierPaths();
  return { imported: records.length, skipped, errors: [] };
}

export async function getApprovedSuppliers(): Promise<
  Pick<
    Supplier,
    | "id"
    | "company_name"
    | "product_categories"
    | "company_photo_url"
    | "business_license_url"
    | "visiting_card_url"
    | "bio"
    | "gallery_urls"
    | "tier"
  >[]
> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, company_name, product_categories, company_photo_url, business_license_url, visiting_card_url, bio, gallery_urls, tier")
    .eq("status", "approved")
    .order("company_name", { ascending: true });

  if (error) return [];
  return data as Supplier[];
}

/** Just the ids, for the sitemap. */
export async function getAllApprovedSupplierIds(): Promise<string[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("suppliers").select("id").eq("status", "approved");
  if (error || !data) return [];
  return data.map((s) => s.id as string);
}

export async function getApprovedSupplierById(id: string): Promise<Supplier | null> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("suppliers").select("*").eq("id", id).eq("status", "approved").maybeSingle();
  if (error) return null;
  return data as Supplier | null;
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

  const { data: existing } = await supabase
    .from("suppliers")
    .select("status, company_name, referred_by_supplier_id")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("suppliers")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw new Error(error.message);

  // Close the loop for the referrer only on the actual pending/rejected ->
  // approved transition — same "don't re-notify on an unrelated re-save"
  // reasoning as the sourcing-request category-match email.
  const justApproved = existing?.status !== "approved" && status === "approved" && existing?.referred_by_supplier_id;
  if (justApproved) {
    const { data: referrer } = await supabase
      .from("suppliers")
      .select("email")
      .eq("id", existing!.referred_by_supplier_id as string)
      .maybeSingle();
    if (referrer) {
      await notifyReferralApproved({ referrerEmail: referrer.email as string, referredCompanyName: existing!.company_name as string });
    }
  }

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
  bio: string;
  rating: number | null;
  tier: Supplier["tier"];
  category_ids: string[];
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
    bio: input.bio.trim() || null,
    rating: input.rating,
    tier: input.tier,
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
    const galleryResult = await processGalleryUpload(formData, pathPrefix);
    if (!galleryResult.ok) throw new Error(galleryResult.message);
    update.gallery_urls = galleryResult.urls;
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("suppliers").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  await syncSupplierCategories(id, input.category_ids);
  revalidateSupplierPaths();
}

export async function deleteSupplier(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: supplier } = await supabase
    .from("suppliers")
    .select("business_license_url, visiting_card_url, company_photo_url, gallery_urls")
    .eq("id", id)
    .maybeSingle();

  if (supplier) {
    const paths = [
      supplier.business_license_url,
      supplier.visiting_card_url,
      supplier.company_photo_url,
      ...((supplier.gallery_urls as string[] | null) ?? []),
    ]
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
