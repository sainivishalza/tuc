"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { CategoryPage, BlogFaqItem } from "@/lib/supabase/types";

export async function getPublishedCategories(locale: string): Promise<CategoryPage[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("category_pages")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("name", { ascending: true });

  if (error) return [];
  return data as CategoryPage[];
}

export async function getPublishedCategory(
  locale: string,
  slug: string
): Promise<CategoryPage | null> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("category_pages")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as CategoryPage;
}

export async function getAllPublishedCategorySlugs(): Promise<{ locale: string; slug: string }[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("category_pages")
    .select("locale, slug")
    .eq("status", "published");

  if (error) return [];
  return data as { locale: string; slug: string }[];
}

export async function getAllCategoryPages(): Promise<CategoryPage[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("category_pages")
    .select("*")
    .order("slug", { ascending: true })
    .order("locale", { ascending: true });

  if (error) throw new Error(error.message);
  return data as CategoryPage[];
}

export async function getCategoryPageById(id: string): Promise<CategoryPage | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("category_pages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CategoryPage | null;
}

export interface CategoryPageInput {
  slug: string;
  locale: string;
  name: string;
  tagline: string;
  intro: string;
  highlights: string[];
  faq: BlogFaqItem[];
  status: CategoryPage["status"];
  published_at: string | null;
}

function revalidateCategoryPaths(locale: string, slug: string) {
  revalidatePath("/admin/categories");
  revalidatePath(`/${locale}/sourcing`);
  revalidatePath(`/${locale}/sourcing/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createCategoryPage(input: CategoryPageInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.name.trim()) {
    throw new Error("Slug and name are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("category_pages").insert({
    slug: input.slug.trim(),
    locale: input.locale,
    name: input.name.trim(),
    tagline: input.tagline.trim(),
    intro: input.intro.trim(),
    highlights: input.highlights,
    faq: input.faq,
    status: input.status,
    published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
  });

  if (error) throw new Error(error.message);
  revalidateCategoryPaths(input.locale, input.slug);
}

export async function updateCategoryPage(id: string, input: CategoryPageInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.name.trim()) {
    throw new Error("Slug and name are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("category_pages")
    .update({
      slug: input.slug.trim(),
      locale: input.locale,
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      intro: input.intro.trim(),
      highlights: input.highlights,
      faq: input.faq,
      status: input.status,
      published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCategoryPaths(input.locale, input.slug);
}

export async function deleteCategoryPage(id: string, locale: string, slug: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("category_pages").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCategoryPaths(locale, slug);
}
