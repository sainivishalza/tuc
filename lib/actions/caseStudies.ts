"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { CaseStudy, CaseStudyResult } from "@/lib/supabase/types";

export async function getPublishedCaseStudies(locale: string): Promise<CaseStudy[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [];
  return data as CaseStudy[];
}

export async function getPublishedCaseStudy(
  locale: string,
  slug: string
): Promise<CaseStudy | null> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as CaseStudy;
}

export async function getAllPublishedCaseStudySlugs(): Promise<{ locale: string; slug: string }[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("locale, slug")
    .eq("status", "published");

  if (error) return [];
  return data as { locale: string; slug: string }[];
}

export async function getAllCaseStudies(): Promise<CaseStudy[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .order("slug", { ascending: true })
    .order("locale", { ascending: true });

  if (error) throw new Error(error.message);
  return data as CaseStudy[];
}

export async function getCaseStudyById(id: string): Promise<CaseStudy | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as CaseStudy | null;
}

export interface CaseStudyInput {
  slug: string;
  locale: string;
  client_name: string;
  industry: string;
  title: string;
  summary: string;
  challenge: string;
  solution: string;
  results: CaseStudyResult[];
  status: CaseStudy["status"];
  published_at: string | null;
}

function revalidateCaseStudyPaths(locale: string, slug: string) {
  revalidatePath("/admin/case-studies");
  revalidatePath(`/${locale}/case-studies`);
  revalidatePath(`/${locale}/case-studies/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createCaseStudy(input: CaseStudyInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.title.trim()) {
    throw new Error("Slug and title are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("case_studies").insert({
    slug: input.slug.trim(),
    locale: input.locale,
    client_name: input.client_name.trim(),
    industry: input.industry.trim(),
    title: input.title.trim(),
    summary: input.summary.trim(),
    challenge: input.challenge.trim(),
    solution: input.solution.trim(),
    results: input.results,
    status: input.status,
    published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
  });

  if (error) throw new Error(error.message);
  revalidateCaseStudyPaths(input.locale, input.slug);
}

export async function updateCaseStudy(id: string, input: CaseStudyInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.title.trim()) {
    throw new Error("Slug and title are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("case_studies")
    .update({
      slug: input.slug.trim(),
      locale: input.locale,
      client_name: input.client_name.trim(),
      industry: input.industry.trim(),
      title: input.title.trim(),
      summary: input.summary.trim(),
      challenge: input.challenge.trim(),
      solution: input.solution.trim(),
      results: input.results,
      status: input.status,
      published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCaseStudyPaths(input.locale, input.slug);
}

export async function deleteCaseStudy(id: string, locale: string, slug: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("case_studies").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateCaseStudyPaths(locale, slug);
}
