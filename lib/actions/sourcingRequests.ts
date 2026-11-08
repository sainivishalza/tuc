"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { requireSupplierEmailAction } from "@/lib/supplierAuth";
import { checkRateLimit, recordFailedAttempt } from "@/lib/rateLimit";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { validateAndUploadFile, IMAGE_TYPES } from "@/lib/supplierFileUpload";
import { translateSourcingRequest } from "@/lib/translateText";
import {
  notifyNewSourcingRequest,
  notifySourcingRequestApprovedToSuppliers,
  notifySourcingRequestPush,
  notifySourcingRequestInterest,
} from "@/lib/notify";
import type {
  SourcingRequest,
  PublicSourcingRequest,
  AdminSourcingRequest,
  SupplierVisibleSourcingRequest,
  SourcingCategory,
  PlatformSettings,
  PlatformSettingsView,
  Supplier,
  SourcingRequestInterest,
} from "@/lib/supabase/types";

const MAX_IMAGES = 6;

function revalidateSourcingPaths(id?: string) {
  revalidatePath("/admin/sourcing-requests");
  revalidatePath("/admin/quote-requests");
  revalidatePath("/supplier-portal/requirements");
  for (const locale of ["en", "zh", "ru"]) {
    revalidatePath(`/${locale}/sourcing-requests`);
    if (id) revalidatePath(`/${locale}/sourcing-requests/${id}`);
  }
}

async function categoryMap(): Promise<Map<string, string>> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("sourcing_categories").select("id, name");
  return new Map((data ?? []).map((c) => [c.id as string, c.name as string]));
}

export async function getAllCategories(): Promise<SourcingCategory[]> {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("sourcing_categories").select("*").order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as SourcingCategory[];
}

// ---------------------------------------------------------------------------
// Public: submit
// ---------------------------------------------------------------------------

export interface SourcingRequestFormInput {
  title: string;
  description: string;
  type: SourcingRequest["type"];
  category_id: string;
  quantity: string;
  budget_range: string;
  timeline: string;
  destination_country: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  video_url: string;
  social_link: string;
}

export async function submitSourcingRequest(
  input: SourcingRequestFormInput,
  formData: FormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  if (!input.title.trim() || !input.description.trim() || !input.customer_name.trim() || !input.customer_email.trim()) {
    return { success: false, error: "Title, description, name, and email are required." };
  }

  const headersList = await headers();
  const ip = headersList.get("x-forwarded-for")?.split(",").pop()?.trim() ?? "unknown";
  const rateLimitKey = `sourcing-request:${ip}`;

  const limit = await checkRateLimit(rateLimitKey);
  if (!limit.allowed) {
    const minutes = Math.ceil((limit.retryAfterMs ?? 0) / 60000);
    return {
      success: false,
      error: `Too many requests. Please try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`,
    };
  }
  await recordFailedAttempt(rateLimitKey, { maxAttempts: 5, windowMs: 15 * 60 * 1000 });

  const turnstileToken = String(formData.get("turnstileToken") ?? "");
  const captchaOk = await verifyTurnstileToken(turnstileToken, ip);
  if (!captchaOk) {
    return { success: false, error: "Verification failed — please try again." };
  }

  const pathPrefix = `sourcing-requests/${crypto.randomUUID()}`;
  const imageUrls: string[] = [];
  for (let i = 0; i < MAX_IMAGES; i++) {
    const field = `image_${i}`;
    if (!formData.get(field)) continue;
    const result = await validateAndUploadFile(formData, field, IMAGE_TYPES, pathPrefix);
    if (result && !result.ok) return { success: false, error: result.message };
    if (result?.ok) imageUrls.push(result.url);
  }

  const translation = await translateSourcingRequest({ title: input.title.trim(), description: input.description.trim() });

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sourcing_requests")
    .insert({
      title: input.title.trim(),
      description: input.description.trim(),
      type: input.type,
      category_id: input.category_id || null,
      quantity: input.quantity.trim() || null,
      budget_range: input.budget_range.trim() || null,
      timeline: input.timeline.trim() || null,
      destination_country: input.destination_country.trim() || null,
      customer_name: input.customer_name.trim(),
      customer_email: input.customer_email.trim(),
      customer_whatsapp: input.customer_whatsapp.trim() || null,
      image_urls: imageUrls,
      video_url: input.video_url.trim() || null,
      social_link: input.social_link.trim() || null,
      title_zh: translation.title_zh,
      description_zh: translation.description_zh,
      title_ru: translation.title_ru,
      description_ru: translation.description_ru,
      translation_status: translation.status,
      status: "pending",
      source: "direct",
    })
    .select("id")
    .single();

  if (error) {
    return { success: false, error: "Something went wrong. Please try again." };
  }

  await notifyNewSourcingRequest({
    title: input.title.trim(),
    customerName: input.customer_name.trim(),
    customerEmail: input.customer_email.trim(),
  });

  revalidateSourcingPaths();
  return { success: true, id: data.id as string };
}

// ---------------------------------------------------------------------------
// Public: read (anonymized — never selects customer_name/email/whatsapp)
// ---------------------------------------------------------------------------

const PUBLIC_COLUMNS =
  "id, title, description, type, category_id, quantity, budget_range, timeline, destination_country, " +
  "image_urls, video_url, social_link, title_zh, description_zh, title_ru, description_ru, " +
  "translation_status, status, source, quote_request_id, created_at, updated_at, closed_at";

export async function getPublicSourcingRequests(): Promise<PublicSourcingRequest[]> {
  const supabase = getSupabaseAdminClient();
  const [{ data, error }, cats] = await Promise.all([
    supabase.from("sourcing_requests").select(PUBLIC_COLUMNS).eq("status", "approved").order("created_at", { ascending: false }),
    categoryMap(),
  ]);
  if (error) return [];
  return (data as unknown as Omit<PublicSourcingRequest, "category_name">[]).map((r) => ({
    ...r,
    category_name: r.category_id ? cats.get(r.category_id) ?? null : null,
  }));
}

export async function getPublicSourcingRequestById(id: string): Promise<PublicSourcingRequest | null> {
  const supabase = getSupabaseAdminClient();
  const [{ data, error }, cats] = await Promise.all([
    supabase.from("sourcing_requests").select(PUBLIC_COLUMNS).eq("id", id).eq("status", "approved").maybeSingle(),
    categoryMap(),
  ]);
  if (error || !data) return null;
  const row = data as unknown as Omit<PublicSourcingRequest, "category_name">;
  return { ...row, category_name: row.category_id ? cats.get(row.category_id) ?? null : null };
}

// ---------------------------------------------------------------------------
// Supplier portal
// ---------------------------------------------------------------------------

/** Approved requests, full fields, for a logged-in approved supplier.
 * Returns an explanatory null-like empty array (not an error) if the
 * caller's supplier account isn't approved yet — same "pending suppliers
 * see nothing" rule as the public directory. */
export async function getSupplierVisibleSourcingRequests(): Promise<SupplierVisibleSourcingRequest[]> {
  const email = await requireSupplierEmailAction();
  const supabase = getSupabaseAdminClient();

  const { data: supplier } = await supabase.from("suppliers").select("id, status").ilike("email", email).maybeSingle();
  if (!supplier || supplier.status !== "approved") return [];

  const [{ data: requests, error }, cats, { data: interests }] = await Promise.all([
    supabase.from("sourcing_requests").select("*").eq("status", "approved").order("created_at", { ascending: false }),
    categoryMap(),
    supabase.from("sourcing_request_interests").select("sourcing_request_id").eq("supplier_id", supplier.id),
  ]);
  if (error) return [];

  const interestedIds = new Set((interests ?? []).map((i) => i.sourcing_request_id as string));

  return (requests as SourcingRequest[]).map((r) => ({
    ...r,
    category_name: r.category_id ? cats.get(r.category_id) ?? null : null,
    already_interested: interestedIds.has(r.id),
  }));
}

/** Records the click, idempotently (unique constraint — a second click is
 * a no-op, not an error), and emails the customer. Verifies the caller is
 * an approved supplier itself rather than trusting any client-passed id. */
export async function expressInterest(requestId: string): Promise<{ success: boolean; error?: string }> {
  const email = await requireSupplierEmailAction();
  const supabase = getSupabaseAdminClient();

  const { data: supplier } = await supabase.from("suppliers").select("id, status").ilike("email", email).maybeSingle();
  if (!supplier || supplier.status !== "approved") {
    return { success: false, error: "Only approved suppliers can respond to requirements." };
  }

  const { data: request } = await supabase
    .from("sourcing_requests")
    .select("title, customer_email, status")
    .eq("id", requestId)
    .maybeSingle();
  if (!request || request.status !== "approved") {
    return { success: false, error: "This requirement is no longer available." };
  }

  const { error } = await supabase
    .from("sourcing_request_interests")
    .upsert({ sourcing_request_id: requestId, supplier_id: supplier.id }, { onConflict: "sourcing_request_id,supplier_id" });
  if (error) return { success: false, error: "Something went wrong. Please try again." };

  const { count } = await supabase
    .from("sourcing_request_interests")
    .select("*", { count: "exact", head: true })
    .eq("sourcing_request_id", requestId);

  await notifySourcingRequestInterest({
    customerEmail: request.customer_email as string,
    title: request.title as string,
    interestCount: count ?? 1,
  });

  revalidateSourcingPaths(requestId);
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

export async function getPendingSourcingRequestCount(): Promise<number> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { count, error } = await supabase
    .from("sourcing_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getAllSourcingRequests(): Promise<AdminSourcingRequest[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const [{ data, error }, cats, { data: interests }, { data: pushes }] = await Promise.all([
    supabase.from("sourcing_requests").select("*").order("created_at", { ascending: false }),
    categoryMap(),
    supabase.from("sourcing_request_interests").select("sourcing_request_id"),
    supabase.from("sourcing_request_pushes").select("sourcing_request_id"),
  ]);
  if (error) throw new Error(error.message);

  const interestCounts = new Map<string, number>();
  for (const i of interests ?? []) interestCounts.set(i.sourcing_request_id, (interestCounts.get(i.sourcing_request_id) ?? 0) + 1);
  const pushCounts = new Map<string, number>();
  for (const p of pushes ?? []) pushCounts.set(p.sourcing_request_id, (pushCounts.get(p.sourcing_request_id) ?? 0) + 1);

  return (data as SourcingRequest[]).map((r) => ({
    ...r,
    category_name: r.category_id ? cats.get(r.category_id) ?? null : null,
    interest_count: interestCounts.get(r.id) ?? 0,
    push_count: pushCounts.get(r.id) ?? 0,
  }));
}

export async function getSourcingRequestById(id: string): Promise<AdminSourcingRequest | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const [{ data, error }, cats] = await Promise.all([
    supabase.from("sourcing_requests").select("*").eq("id", id).maybeSingle(),
    categoryMap(),
  ]);
  if (error || !data) return null;

  const [{ count: interestCount }, { count: pushCount }] = await Promise.all([
    supabase.from("sourcing_request_interests").select("*", { count: "exact", head: true }).eq("sourcing_request_id", id),
    supabase.from("sourcing_request_pushes").select("*", { count: "exact", head: true }).eq("sourcing_request_id", id),
  ]);

  const row = data as SourcingRequest;
  return {
    ...row,
    category_name: row.category_id ? cats.get(row.category_id) ?? null : null,
    interest_count: interestCount ?? 0,
    push_count: pushCount ?? 0,
  };
}

export interface InterestedSupplierRow {
  interest_id: string;
  supplier_id: string;
  company_name: string;
  email: string;
  phone: string | null;
  deal_status: SourcingRequestInterest["deal_status"];
}

/** Suppliers who've clicked "I'm interested" on this requirement — for the
 * admin detail view, so staff can see engagement even though contact is
 * revealed directly to the supplier rather than routed through staff.
 * Also carries each interest's deal_status so staff can record whether
 * it actually turned into a deal (see updateInterestDealStatus) — the
 * platform has no other way to find that out, since the conversation
 * itself happens off-platform. */
export async function getInterestedSuppliers(requestId: string): Promise<InterestedSupplierRow[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: interests } = await supabase
    .from("sourcing_request_interests")
    .select("id, supplier_id, deal_status")
    .eq("sourcing_request_id", requestId);
  if (!interests || interests.length === 0) return [];

  const ids = interests.map((i) => i.supplier_id as string);
  const { data: suppliers } = await supabase.from("suppliers").select("id, company_name, email, phone").in("id", ids);
  const supplierMap = new Map((suppliers ?? []).map((s) => [s.id as string, s]));

  return interests
    .map((i) => {
      const s = supplierMap.get(i.supplier_id as string);
      if (!s) return null;
      return {
        interest_id: i.id as string,
        supplier_id: i.supplier_id as string,
        company_name: s.company_name as string,
        email: s.email as string,
        phone: s.phone as string | null,
        deal_status: i.deal_status as SourcingRequestInterest["deal_status"],
      };
    })
    .filter((r): r is InterestedSupplierRow => r !== null);
}

/** Marking an interest "won" also closes the parent request — a deal
 * going through means the requirement is done, same as a customer or
 * staff closing it manually. Never auto-reopens a request on "lost" or
 * "pending", since other suppliers may still be in the running. */
export async function updateInterestDealStatus(
  interestId: string,
  dealStatus: SourcingRequestInterest["deal_status"]
): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sourcing_request_interests")
    .update({ deal_status: dealStatus })
    .eq("id", interestId)
    .select("sourcing_request_id")
    .single();
  if (error) throw new Error(error.message);

  if (dealStatus === "won" && data?.sourcing_request_id) {
    await supabase
      .from("sourcing_requests")
      .update({ status: "closed", closed_at: new Date().toISOString() })
      .eq("id", data.sourcing_request_id);
  }

  revalidateSourcingPaths(data?.sourcing_request_id);
}

/** A supplier's completed-deal count, for their public profile — the
 * one piece of real track record the marketplace can show, since it's
 * staff-confirmed rather than self-reported. */
export async function getCompletedDealCount(supplierId: string): Promise<number> {
  const supabase = getSupabaseAdminClient();
  const { count } = await supabase
    .from("sourcing_request_interests")
    .select("*", { count: "exact", head: true })
    .eq("supplier_id", supplierId)
    .eq("deal_status", "won");
  return count ?? 0;
}

export async function getApprovedSuppliersForPush(): Promise<Pick<Supplier, "id" | "company_name" | "email" | "product_categories">[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("suppliers")
    .select("id, company_name, email, product_categories")
    .eq("status", "approved")
    .order("company_name", { ascending: true });
  if (error) throw new Error(error.message);
  return data as Pick<Supplier, "id" | "company_name" | "email" | "product_categories">[];
}

export interface SourcingRequestEditInput {
  title: string;
  description: string;
  type: SourcingRequest["type"];
  category_id: string;
  quantity: string;
  budget_range: string;
  timeline: string;
  destination_country: string;
  customer_name: string;
  customer_email: string;
  customer_whatsapp: string;
  video_url: string;
  social_link: string;
  title_zh: string;
  description_zh: string;
  title_ru: string;
  description_ru: string;
  status: SourcingRequest["status"];
}

/** Full admin edit — every field, including status. A pending/rejected/
 * closed -> approved transition fires the category-match supplier emails;
 * any other transition (including approved -> approved re-saves) does not,
 * so editing an already-approved request doesn't re-spam suppliers. */
export async function updateSourcingRequest(id: string, input: SourcingRequestEditInput): Promise<void> {
  await requireAdminAction();
  if (!input.title.trim() || !input.description.trim()) {
    throw new Error("Title and description are required.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("sourcing_requests").select("status, category_id").eq("id", id).maybeSingle();

  const update: Record<string, unknown> = {
    title: input.title.trim(),
    description: input.description.trim(),
    type: input.type,
    category_id: input.category_id || null,
    quantity: input.quantity.trim() || null,
    budget_range: input.budget_range.trim() || null,
    timeline: input.timeline.trim() || null,
    destination_country: input.destination_country.trim() || null,
    customer_name: input.customer_name.trim(),
    customer_email: input.customer_email.trim(),
    customer_whatsapp: input.customer_whatsapp.trim() || null,
    video_url: input.video_url.trim() || null,
    social_link: input.social_link.trim() || null,
    title_zh: input.title_zh.trim() || null,
    description_zh: input.description_zh.trim() || null,
    title_ru: input.title_ru.trim() || null,
    description_ru: input.description_ru.trim() || null,
    status: input.status,
    updated_at: new Date().toISOString(),
    closed_at: input.status === "closed" ? new Date().toISOString() : null,
  };

  const { error } = await supabase.from("sourcing_requests").update(update).eq("id", id);
  if (error) throw new Error(error.message);

  const justApproved = existing?.status !== "approved" && input.status === "approved";
  if (justApproved && input.category_id) {
    const { data: matchingSuppliers } = await supabase
      .from("supplier_categories")
      .select("suppliers!inner(email, status)")
      .eq("category_id", input.category_id);
    const emails = (matchingSuppliers ?? [])
      .map((row) => (row as unknown as { suppliers: { email: string; status: string } }).suppliers)
      .filter((s) => s?.status === "approved")
      .map((s) => s.email);
    if (emails.length > 0) {
      await notifySourcingRequestApprovedToSuppliers({
        title: input.title.trim(),
        description: input.description.trim(),
        requestId: id,
        supplierEmails: emails,
      });
    }
  }

  revalidateSourcingPaths(id);
}

/** Staff-initiated: wraps a quote_request's details into a new, separate
 * Sourcing Request row (status starts at 'pending', same review gate as a
 * directly-posted one) rather than mutating quote_requests itself — the
 * two stay independent records linked only by quote_request_id. */
export async function promoteQuoteRequestToSourcingRequest(quoteRequestId: string): Promise<{ id: string }> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();

  const { data: quote, error: quoteError } = await supabase
    .from("quote_requests")
    .select("*")
    .eq("id", quoteRequestId)
    .single();
  if (quoteError || !quote) throw new Error("Quote request not found.");

  const title = quote.product ? `${quote.product}` : `Sourcing request from ${quote.name}`;
  const description = quote.message || quote.product || "No description provided.";

  const translation = await translateSourcingRequest({ title, description });

  const { data, error } = await supabase
    .from("sourcing_requests")
    .insert({
      title,
      description,
      type: "product",
      quantity: quote.quantity,
      timeline: quote.timeline,
      customer_name: quote.name,
      customer_email: quote.email,
      customer_whatsapp: quote.whatsapp,
      title_zh: translation.title_zh,
      description_zh: translation.description_zh,
      title_ru: translation.title_ru,
      description_ru: translation.description_ru,
      translation_status: translation.status,
      status: "pending",
      source: "promoted_from_quote",
      quote_request_id: quoteRequestId,
    })
    .select("id")
    .single();
  if (error) throw new Error(error.message);

  revalidateSourcingPaths(data.id as string);
  return { id: data.id as string };
}

/** Staff hand-pick — on top of the open board and the automatic
 * category-match email, lets staff notify specific suppliers directly
 * (e.g. ones outside the obvious category match). Logged per-supplier so
 * the admin detail view can show who was already pushed. */
export async function pushToSuppliers(requestId: string, supplierIds: string[]): Promise<void> {
  await requireAdminAction();
  if (supplierIds.length === 0) return;
  const supabase = getSupabaseAdminClient();

  const { data: request } = await supabase.from("sourcing_requests").select("title, description").eq("id", requestId).single();
  if (!request) throw new Error("Sourcing request not found.");

  const { data: suppliers } = await supabase.from("suppliers").select("id, email").in("id", supplierIds);
  if (!suppliers || suppliers.length === 0) return;

  const { error } = await supabase
    .from("sourcing_request_pushes")
    .upsert(
      suppliers.map((s) => ({ sourcing_request_id: requestId, supplier_id: s.id })),
      { onConflict: "sourcing_request_id,supplier_id" }
    );
  if (error) throw new Error(error.message);

  await notifySourcingRequestPush({
    title: request.title as string,
    description: request.description as string,
    supplierEmails: suppliers.map((s) => s.email as string),
  });

  revalidateSourcingPaths(requestId);
}

// ---------------------------------------------------------------------------
// Platform settings (connect mode / monetization — admin-configurable)
// ---------------------------------------------------------------------------

/** Masks a stored API key for display — e.g. "sk-or-v1-abc...9f2k" becomes
 * "••••9f2k". Never send the raw key to a client component's props; this
 * is what the admin UI renders instead, and the input only overwrites it
 * when the admin actually types a new value (see updatePlatformSettings). */
function maskKey(key: string | null): string | null {
  if (!key) return null;
  if (key.length <= 4) return "••••";
  return `••••${key.slice(-4)}`;
}

export async function getPlatformSettings(): Promise<PlatformSettingsView> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.from("platform_settings").select("*").eq("id", "default").single();
  if (error) throw new Error(error.message);
  const row = data as PlatformSettings;
  return {
    id: row.id,
    connect_mode: row.connect_mode,
    monetization_mode: row.monetization_mode,
    ai_provider: row.ai_provider,
    ai_key_preview: maskKey(row.ai_api_key),
    ai_model: row.ai_model,
    ai_base_url: row.ai_base_url,
    updated_at: row.updated_at,
  };
}

export async function updatePlatformSettings(input: {
  connect_mode: PlatformSettings["connect_mode"];
  monetization_mode: PlatformSettings["monetization_mode"];
  ai_provider: PlatformSettings["ai_provider"];
  /** Omit or leave blank to keep the currently-stored key unchanged —
   * the admin UI never has the real value to send back, only its mask. */
  ai_api_key?: string;
  ai_model?: string;
  ai_base_url?: string;
}): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const update: Record<string, unknown> = {
    connect_mode: input.connect_mode,
    monetization_mode: input.monetization_mode,
    ai_provider: input.ai_provider,
    ai_model: input.ai_model?.trim() || null,
    ai_base_url: input.ai_base_url?.trim() || null,
    updated_at: new Date().toISOString(),
  };
  if (input.ai_api_key?.trim()) {
    update.ai_api_key = input.ai_api_key.trim();
  }
  const { error } = await supabase.from("platform_settings").update(update).eq("id", "default");
  if (error) throw new Error(error.message);
  revalidateSourcingPaths();
}
