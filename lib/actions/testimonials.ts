"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { Testimonial } from "@/lib/supabase/types";

const LOGO_BUCKET = "site-assets";
const LOGO_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // 2MB — a logo, not a photo

/** Same reasoning as blogPosts.ts's image upload — `file.type` is just the
 * browser-declared Content-Type, not verified content. */
function matchesDeclaredImageType(bytes: Uint8Array, declaredType: string): boolean {
  const startsWith = (sig: number[]) => sig.every((b, i) => bytes[i] === b);
  switch (declaredType) {
    case "image/png":
      return startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith([0xff, 0xd8, 0xff]);
    case "image/webp":
      return (
        startsWith([0x52, 0x49, 0x46, 0x46]) &&
        bytes[8] === 0x57 &&
        bytes[9] === 0x45 &&
        bytes[10] === 0x42 &&
        bytes[11] === 0x50
      );
    default:
      return false;
  }
}

/** Returns null (no-op) when the form's logo field is empty — a
 * testimonial isn't required to have a logo, and an edit form re-submits
 * this field empty when the admin isn't changing an already-set logo. */
async function uploadLogoIfProvided(formData: FormData): Promise<string | null> {
  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) return null;
  if (!LOGO_IMAGE_TYPES.includes(file.type)) {
    throw new Error("Logo must be PNG, JPEG, or WebP.");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("Logo must be smaller than 2MB.");
  }

  const arrayBuffer = await file.arrayBuffer();
  if (!matchesDeclaredImageType(new Uint8Array(arrayBuffer), file.type)) {
    throw new Error("That file doesn't look like a valid image. Try a different file.");
  }

  const ext = file.type.split("/")[1];
  const path = `testimonials/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(LOGO_BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
  });
  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function getApprovedTestimonials(): Promise<Testimonial[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as Testimonial[];
}

export async function getAllTestimonials(): Promise<Testimonial[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("testimonials")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as Testimonial[];
}

function revalidateTestimonialPaths() {
  revalidatePath("/admin/testimonials");
  revalidatePath("/[locale]", "page");
}

export async function createTestimonial(formData: FormData): Promise<void> {
  await requireAdminAction();
  const name = String(formData.get("name") ?? "").trim();
  const quote = String(formData.get("quote") ?? "").trim();
  if (!name || !quote) {
    throw new Error("Name and quote are required.");
  }

  const logoUrl = await uploadLogoIfProvided(formData);

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("testimonials").insert({
    name,
    company: String(formData.get("company") ?? "").trim() || null,
    quote,
    rating: Number(formData.get("rating") ?? 5),
    locale: String(formData.get("locale") ?? "en"),
    status: (formData.get("status") as Testimonial["status"]) ?? "approved",
    country_code: String(formData.get("country_code") ?? "").trim() || null,
    logo_url: logoUrl,
  });

  if (error) throw new Error(error.message);
  revalidateTestimonialPaths();
}

/** Covers everything an admin needs to fix on a testimonial after it's
 * created — status, country, and adding/replacing the logo — without a
 * separate edit page. Name/company/quote stay create-only for now,
 * matching this page's existing (pre-this-change) scope. A resubmitted
 * form with no new logo file leaves logo_url untouched rather than
 * clearing it. */
export async function updateTestimonialDetails(id: string, formData: FormData): Promise<void> {
  await requireAdminAction();
  const newLogoUrl = await uploadLogoIfProvided(formData);

  const update: { status: Testimonial["status"]; country_code: string | null; logo_url?: string } = {
    status: formData.get("status") as Testimonial["status"],
    country_code: String(formData.get("country_code") ?? "").trim() || null,
  };
  if (newLogoUrl) update.logo_url = newLogoUrl;

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("testimonials").update(update).eq("id", id);

  if (error) throw new Error(error.message);
  revalidateTestimonialPaths();
}

export async function deleteTestimonial(id: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("testimonials").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateTestimonialPaths();
}
