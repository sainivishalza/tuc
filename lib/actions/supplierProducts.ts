"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import { requireSupplierEmailAction } from "@/lib/supplierAuth";
import { processGalleryUpload } from "@/lib/supplierFileUpload";
import type { SupplierProduct, PublicSupplierProduct, PriceTier } from "@/lib/supabase/types";

function revalidateProductPaths(supplierId?: string, productId?: string) {
  revalidatePath("/admin/products");
  revalidatePath("/supplier-portal/products");
  for (const locale of ["en", "zh", "ru"]) {
    revalidatePath(`/${locale}/products`);
    if (productId) revalidatePath(`/${locale}/products/${productId}`);
    if (supplierId) revalidatePath(`/${locale}/suppliers/${supplierId}`);
  }
}

async function categoryMap(): Promise<Map<string, string>> {
  const supabase = getSupabaseAdminClient();
  const { data } = await supabase.from("sourcing_categories").select("id, name");
  return new Map((data ?? []).map((c) => [c.id as string, c.name as string]));
}

/** `price_tiers` arrives as a JSON-stringified array via a hidden field —
 * same hidden-field-carries-client-array convention as existing_gallery_urls
 * (lib/supplierFileUpload.ts). Sorted ascending by min_qty so the lowest
 * tier is always index 0, matching real quantity-break pricing. */
function parsePriceTiers(raw: FormDataEntryValue | null): PriceTier[] {
  if (typeof raw !== "string" || !raw.trim()) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((t) => ({ min_qty: Number(t?.min_qty), price: Number(t?.price) }))
      .filter((t) => Number.isFinite(t.min_qty) && t.min_qty >= 0 && Number.isFinite(t.price) && t.price >= 0)
      .sort((a, b) => a.min_qty - b.min_qty);
  } catch {
    return [];
  }
}

export interface ProductFormInput {
  title: string;
  description: string;
  category_id: string;
  price_unit: string;
  moq: string;
  lead_time: string;
  unit: string;
  customizable: boolean;
  customization_notes: string;
  sample_available: boolean;
  sample_price: string;
  port_of_shipment: string;
  status: SupplierProduct["status"];
}

/** Shared by supplier self-service create/update and the admin edit —
 * the three differ only in auth gate and ownership check, never in which
 * fields get written. */
function buildProductFields(input: ProductFormInput, imageUrls: string[], priceTiers: PriceTier[]) {
  return {
    category_id: input.category_id || null,
    title: input.title.trim(),
    description: input.description.trim() || null,
    image_urls: imageUrls,
    price_tiers: priceTiers,
    price_unit: input.price_unit.trim() || null,
    moq: input.moq.trim() || null,
    lead_time: input.lead_time.trim() || null,
    unit: input.unit.trim() || null,
    customizable: input.customizable,
    customization_notes: input.customization_notes.trim() || null,
    sample_available: input.sample_available,
    sample_price: input.sample_price.trim() ? Number(input.sample_price) : null,
    port_of_shipment: input.port_of_shipment.trim() || null,
    status: input.status,
  };
}

// ---------------------------------------------------------------------------
// Supplier self-service — unrestricted by approval status, same as
// updateOwnSupplierProfile: a supplier can prep their catalog any time,
// but public visibility (getPublicProducts et al below) requires their
// account itself to be approved, same gate the directory already uses.
// ---------------------------------------------------------------------------

async function ownSupplierId(): Promise<string> {
  const email = await requireSupplierEmailAction();
  const supabase = getSupabaseAdminClient();
  const { data: supplier } = await supabase.from("suppliers").select("id").ilike("email", email).maybeSingle();
  if (!supplier) throw new Error("We couldn't find your supplier account.");
  return supplier.id as string;
}

export async function getMyProducts(): Promise<SupplierProduct[]> {
  const supplierId = await ownSupplierId();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_products")
    .select("*")
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as SupplierProduct[];
}

export async function createProduct(
  input: ProductFormInput,
  formData: FormData
): Promise<{ success: boolean; error?: string; id?: string }> {
  const supplierId = await ownSupplierId();
  if (!input.title.trim()) return { success: false, error: "Title is required." };

  const pathPrefix = `suppliers/${supplierId}/products/${crypto.randomUUID()}`;
  const galleryResult = await processGalleryUpload(formData, pathPrefix);
  if (!galleryResult.ok) return { success: false, error: galleryResult.message };
  if (galleryResult.urls.length === 0) return { success: false, error: "At least one photo is required." };

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("supplier_products")
    .insert({ supplier_id: supplierId, ...buildProductFields(input, galleryResult.urls, parsePriceTiers(formData.get("price_tiers"))) })
    .select("id")
    .single();
  if (error) return { success: false, error: "Something went wrong. Please try again." };

  revalidateProductPaths(supplierId, data.id as string);
  return { success: true, id: data.id as string };
}

export async function updateProduct(
  id: string,
  input: ProductFormInput,
  formData: FormData
): Promise<{ success: boolean; error?: string }> {
  const supplierId = await ownSupplierId();
  if (!input.title.trim()) return { success: false, error: "Title is required." };

  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("supplier_products").select("supplier_id").eq("id", id).maybeSingle();
  if (!existing || existing.supplier_id !== supplierId) {
    return { success: false, error: "You can only edit your own products." };
  }

  const pathPrefix = `suppliers/${supplierId}/products/${id}`;
  const galleryResult = await processGalleryUpload(formData, pathPrefix);
  if (!galleryResult.ok) return { success: false, error: galleryResult.message };
  if (galleryResult.urls.length === 0) return { success: false, error: "At least one photo is required." };

  const { error } = await supabase
    .from("supplier_products")
    .update({
      ...buildProductFields(input, galleryResult.urls, parsePriceTiers(formData.get("price_tiers"))),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) return { success: false, error: "Something went wrong. Please try again." };

  revalidateProductPaths(supplierId, id);
  return { success: true };
}

export async function deleteProduct(id: string): Promise<void> {
  const supplierId = await ownSupplierId();
  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("supplier_products").select("supplier_id").eq("id", id).maybeSingle();
  if (!existing || existing.supplier_id !== supplierId) {
    throw new Error("You can only delete your own products.");
  }
  const { error } = await supabase.from("supplier_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateProductPaths(supplierId, id);
}

// ---------------------------------------------------------------------------
// Public: read (only active products belonging to approved suppliers)
// ---------------------------------------------------------------------------

async function fetchActiveApprovedProducts(): Promise<{ product: SupplierProduct; supplierName: string }[]> {
  const supabase = getSupabaseAdminClient();
  const [{ data: products, error }, { data: suppliers }] = await Promise.all([
    supabase.from("supplier_products").select("*").eq("status", "active").order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, company_name").eq("status", "approved"),
  ]);
  if (error || !products) return [];
  const approvedMap = new Map((suppliers ?? []).map((s) => [s.id as string, s.company_name as string]));
  return (products as SupplierProduct[])
    .filter((p) => approvedMap.has(p.supplier_id))
    .map((p) => ({ product: p, supplierName: approvedMap.get(p.supplier_id)! }));
}

/** Every active product of an approved supplier — unfiltered, unpaginated.
 * Same "fetch everything, filter client-side" shape as
 * getPublicSourcingRequests/SourcingRequestsBoard; the catalog board
 * component applies category/search/price filtering itself. Revisit with
 * real server-side pagination once the catalog has enough products for
 * an unbounded fetch to matter. */
export async function getPublicProducts(): Promise<PublicSupplierProduct[]> {
  const [rows, cats] = await Promise.all([fetchActiveApprovedProducts(), categoryMap()]);
  return rows.map((r) => ({
    ...r.product,
    category_name: r.product.category_id ? cats.get(r.product.category_id) ?? null : null,
    supplier_company_name: r.supplierName,
  }));
}

export async function getPublicProductById(id: string): Promise<PublicSupplierProduct | null> {
  const rows = await fetchActiveApprovedProducts();
  const row = rows.find((r) => r.product.id === id);
  if (!row) return null;
  const cats = await categoryMap();
  return {
    ...row.product,
    category_name: row.product.category_id ? cats.get(row.product.category_id) ?? null : null,
    supplier_company_name: row.supplierName,
  };
}

/** For a supplier's own public profile page — active products of an
 * approved supplier only; an empty array (not an error) for any other
 * supplier id, same "quietly show nothing" rule the directory itself uses. */
export async function getProductsBySupplier(supplierId: string): Promise<PublicSupplierProduct[]> {
  const supabase = getSupabaseAdminClient();
  const { data: supplier } = await supabase.from("suppliers").select("company_name, status").eq("id", supplierId).maybeSingle();
  if (!supplier || supplier.status !== "approved") return [];

  const [{ data: products }, cats] = await Promise.all([
    supabase
      .from("supplier_products")
      .select("*")
      .eq("supplier_id", supplierId)
      .eq("status", "active")
      .order("created_at", { ascending: false }),
    categoryMap(),
  ]);

  return ((products ?? []) as SupplierProduct[]).map((p) => ({
    ...p,
    category_name: p.category_id ? cats.get(p.category_id) ?? null : null,
    supplier_company_name: supplier.company_name as string,
  }));
}

// ---------------------------------------------------------------------------
// Admin — can touch any supplier's product, no ownership check
// ---------------------------------------------------------------------------

export interface AdminSupplierProduct extends SupplierProduct {
  category_name: string | null;
  supplier_company_name: string;
}

export async function getAllProductsAdmin(): Promise<AdminSupplierProduct[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const [{ data: products, error }, { data: suppliers }, cats] = await Promise.all([
    supabase.from("supplier_products").select("*").order("created_at", { ascending: false }),
    supabase.from("suppliers").select("id, company_name"),
    categoryMap(),
  ]);
  if (error) throw new Error(error.message);

  const nameMap = new Map((suppliers ?? []).map((s) => [s.id as string, s.company_name as string]));
  return (products as SupplierProduct[]).map((p) => ({
    ...p,
    category_name: p.category_id ? cats.get(p.category_id) ?? null : null,
    supplier_company_name: nameMap.get(p.supplier_id) ?? "Unknown supplier",
  }));
}

export async function getProductByIdAdmin(id: string): Promise<AdminSupplierProduct | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: product, error } = await supabase.from("supplier_products").select("*").eq("id", id).maybeSingle();
  if (error || !product) return null;

  const [{ data: supplier }, cats] = await Promise.all([
    supabase.from("suppliers").select("company_name").eq("id", product.supplier_id).maybeSingle(),
    categoryMap(),
  ]);

  const row = product as SupplierProduct;
  return {
    ...row,
    category_name: row.category_id ? cats.get(row.category_id) ?? null : null,
    supplier_company_name: (supplier?.company_name as string) ?? "Unknown supplier",
  };
}

export async function adminUpdateProduct(id: string, input: ProductFormInput, formData: FormData): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("supplier_products").select("supplier_id").eq("id", id).maybeSingle();
  if (!existing) throw new Error("Product not found.");

  const pathPrefix = `suppliers/${existing.supplier_id}/products/${id}`;
  const galleryResult = await processGalleryUpload(formData, pathPrefix);
  if (!galleryResult.ok) throw new Error(galleryResult.message);

  const { error } = await supabase
    .from("supplier_products")
    .update({
      ...buildProductFields(input, galleryResult.urls, parsePriceTiers(formData.get("price_tiers"))),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidateProductPaths(existing.supplier_id as string, id);
}

export async function adminDeleteProduct(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data: existing } = await supabase.from("supplier_products").select("supplier_id").eq("id", id).maybeSingle();
  const { error } = await supabase.from("supplier_products").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidateProductPaths(existing?.supplier_id as string | undefined, id);
}
