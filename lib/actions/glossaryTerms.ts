"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { GlossaryTerm } from "@/lib/supabase/types";

export async function getPublishedGlossaryTerms(locale: string): Promise<GlossaryTerm[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("term", { ascending: true });

  if (error) return [];
  return data as GlossaryTerm[];
}

export async function getAllGlossaryTerms(): Promise<GlossaryTerm[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .order("slug", { ascending: true })
    .order("locale", { ascending: true });

  if (error) throw new Error(error.message);
  return data as GlossaryTerm[];
}

export async function getGlossaryTermById(id: string): Promise<GlossaryTerm | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("glossary_terms")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as GlossaryTerm | null;
}

export interface GlossaryTermInput {
  term: string;
  slug: string;
  locale: string;
  definition: string;
  status: GlossaryTerm["status"];
}

function revalidateGlossaryPaths(locale: string) {
  revalidatePath("/admin/glossary");
  revalidatePath(`/${locale}/glossary`);
  revalidatePath("/sitemap.xml");
}

export async function createGlossaryTerm(input: GlossaryTermInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.term.trim()) {
    throw new Error("Slug and term are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("glossary_terms").insert({
    term: input.term.trim(),
    slug: input.slug.trim(),
    locale: input.locale,
    definition: input.definition.trim(),
    status: input.status,
  });

  if (error) throw new Error(error.message);
  revalidateGlossaryPaths(input.locale);
}

export async function updateGlossaryTerm(id: string, input: GlossaryTermInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.term.trim()) {
    throw new Error("Slug and term are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("glossary_terms")
    .update({
      term: input.term.trim(),
      slug: input.slug.trim(),
      locale: input.locale,
      definition: input.definition.trim(),
      status: input.status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateGlossaryPaths(input.locale);
}

export async function deleteGlossaryTerm(id: string, locale: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("glossary_terms").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateGlossaryPaths(locale);
}
