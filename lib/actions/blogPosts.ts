"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { BlogPost, BlogBodyBlock } from "@/lib/supabase/types";

export async function getPublishedPosts(locale: string): Promise<BlogPost[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .order("published_at", { ascending: false });

  if (error) return [];
  return data as BlogPost[];
}

export async function getPublishedPost(
  locale: string,
  slug: string
): Promise<BlogPost | null> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("locale", locale)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error || !data) return null;
  return data as BlogPost;
}

export async function getAllPublishedSlugs(): Promise<{ locale: string; slug: string }[]> {
  const supabase = getSupabasePublicClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("locale, slug")
    .eq("status", "published");

  if (error) return [];
  return data as { locale: string; slug: string }[];
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("slug", { ascending: true })
    .order("locale", { ascending: true });

  if (error) throw new Error(error.message);
  return data as BlogPost[];
}

export async function getBlogPostById(id: string): Promise<BlogPost | null> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as BlogPost | null;
}

export interface BlogPostInput {
  slug: string;
  locale: string;
  title: string;
  excerpt: string;
  summary: string;
  body: BlogBodyBlock[];
  faq: { q: string; a: string }[];
  author_name: string;
  author_title: string;
  author_bio: string;
  read_time: string;
  status: BlogPost["status"];
  published_at: string | null;
}

function revalidateBlogPaths(locale: string, slug: string) {
  revalidatePath("/admin/blog");
  revalidatePath(`/${locale}/blog`);
  revalidatePath(`/${locale}/blog/${slug}`);
  revalidatePath("/sitemap.xml");
}

export async function createBlogPost(input: BlogPostInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.title.trim()) {
    throw new Error("Slug and title are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("blog_posts").insert({
    slug: input.slug.trim(),
    locale: input.locale,
    title: input.title.trim(),
    excerpt: input.excerpt.trim(),
    summary: input.summary.trim(),
    body: input.body,
    faq: input.faq,
    author_name: input.author_name.trim(),
    author_title: input.author_title.trim(),
    author_bio: input.author_bio.trim(),
    read_time: input.read_time.trim() || null,
    status: input.status,
    published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
  });

  if (error) throw new Error(error.message);
  revalidateBlogPaths(input.locale, input.slug);
}

export async function updateBlogPost(id: string, input: BlogPostInput): Promise<void> {
  await requireAdminAction();
  if (!input.slug.trim() || !input.title.trim()) {
    throw new Error("Slug and title are required.");
  }
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("blog_posts")
    .update({
      slug: input.slug.trim(),
      locale: input.locale,
      title: input.title.trim(),
      excerpt: input.excerpt.trim(),
      summary: input.summary.trim(),
      body: input.body,
      faq: input.faq,
      author_name: input.author_name.trim(),
      author_title: input.author_title.trim(),
      author_bio: input.author_bio.trim(),
      read_time: input.read_time.trim() || null,
      status: input.status,
      published_at: input.status === "published" ? (input.published_at || new Date().toISOString().slice(0, 10)) : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBlogPaths(input.locale, input.slug);
}

export async function deleteBlogPost(id: string, locale: string, slug: string): Promise<void> {
  await requireAdminAction();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidateBlogPaths(locale, slug);
}
