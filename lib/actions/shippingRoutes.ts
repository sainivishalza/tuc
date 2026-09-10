"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { ShippingRoute, BlogFaqItem } from "@/lib/supabase/types";

export async function getPublishedRoutes(locale: string): Promise<ShippingRoute[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("shipping_routes")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("destination_name", { ascending: true });

  if (error) return [];
  return data as ShippingRoute[];
}

export async function getPublishedRoute(
  locale: string,
  slug: string
): Promise<ShippingRoute | null> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("shipping_routes")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as ShippingRoute;
}

export async function getAllPublishedRouteSlugs(): Promise<{ locale: string; slug: string }[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("shipping_routes")
    .select("locale, slug")
    .eq("status", "published");

  if (error) return [];
  return data as { locale: string; slug: string }[];
}

export async function getAllShippingRoutes(): Promise<ShippingRoute[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_routes")
    .select("*")
    .order("slug", { ascending: true })
    .order("locale", { ascending: true });

  if (error) throw new Error(error.message);
  return data as ShippingRoute[];
}

export async function getShippingRouteById(id: string): Promise<ShippingRoute | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("shipping_routes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as ShippingRoute | null;
}

export interface ShippingRouteInput {
  slug: string;
  locale: string;
  destination_name: string;
  tagline: string;
  intro: string;
  sea_transit: string;
  air_transit: string;
  express_transit: string;
  highlights: string[];
  faq: BlogFaqItem[];
  status: ShippingRoute["status"];
  published_at: string | null;
}

function revalidateRoutePaths(locale: string, slug: string) {
  revalidatePath("/admin/shipping-routes");
  revalidatePath(`/${locale}/shipping`);
  revalidatePath(`/${locale}/shipping/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createShippingRoute(input: ShippingRouteInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.destination_name.trim()) {
    throw new Error("Slug and destination name are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("shipping_routes").insert({
    slug: input.slug.trim(),
    locale: input.locale,
    destination_name: input.destination_name.trim(),
    tagline: input.tagline.trim(),
    intro: input.intro.trim(),
    sea_transit: input.sea_transit.trim(),
    air_transit: input.air_transit.trim(),
    express_transit: input.express_transit.trim(),
    highlights: input.highlights,
    faq: input.faq,
    status: input.status,
    published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
  });

  if (error) throw new Error(error.message);
  revalidateRoutePaths(input.locale, input.slug);
}

export async function updateShippingRoute(id: string, input: ShippingRouteInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.destination_name.trim()) {
    throw new Error("Slug and destination name are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("shipping_routes")
    .update({
      slug: input.slug.trim(),
      locale: input.locale,
      destination_name: input.destination_name.trim(),
      tagline: input.tagline.trim(),
      intro: input.intro.trim(),
      sea_transit: input.sea_transit.trim(),
      air_transit: input.air_transit.trim(),
      express_transit: input.express_transit.trim(),
      highlights: input.highlights,
      faq: input.faq,
      status: input.status,
      published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateRoutePaths(input.locale, input.slug);
}

export async function deleteShippingRoute(id: string, locale: string, slug: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("shipping_routes").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateRoutePaths(locale, slug);
}
