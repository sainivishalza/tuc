"use server";

import { revalidatePath } from "next/cache";
import { getSupabasePublicClient } from "@/lib/supabase/publicClient";
import { getSupabaseAdminClient } from "@/lib/supabase/adminClient";
import { requireAdminAction } from "@/lib/adminAuth";
import type { BlogPost, BlogBodyBlock } from "@/lib/supabase/types";

const IMAGE_BUCKET = "site-assets";
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB

/** Same reasoning as theme.ts's logo upload and suppliers.ts's document
 * upload — `file.type` is just the browser-declared Content-Type, not
 * verified content. Checking magic bytes catches a mismatch before it's
 * stored and served publicly from the blog's image bucket. */
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

export interface BlogImageUploadResult {
  ok: boolean;
  url?: string;
  message: string;
}

/** Uploads a body-block image to its own path (not a fixed one, unlike the
 * site logo) since a post can hold several images across its lifetime and
 * old ones stay referenced by already-published body content. */
export async function uploadBlogImage(formData: FormData): Promise<BlogImageUploadResult> {
  await requireAdminAction();

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "No file selected." };
  }
  if (!IMAGE_TYPES.includes(file.type)) {
    return { ok: false, message: "Image must be PNG, JPEG, or WebP." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { ok: false, message: "Image must be smaller than 5MB." };
  }

  const arrayBuffer = await file.arrayBuffer();
  if (!matchesDeclaredImageType(new Uint8Array(arrayBuffer), file.type)) {
    return { ok: false, message: "That file doesn't look like a valid image. Try a different file." };
  }

  const ext = file.type.split("/")[1];
  const path = `blog/${crypto.randomUUID()}.${ext}`;

  const supabase = getSupabaseAdminClient();
  const { error: uploadError } = await supabase.storage.from(IMAGE_BUCKET).upload(path, arrayBuffer, {
    contentType: file.type,
  });
  if (uploadError) return { ok: false, message: uploadError.message };

  const { data } = supabase.storage.from(IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, message: "Uploaded." };
}

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
