"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createBlogPost, updateBlogPost, uploadBlogImage } from "@/lib/actions/blogPosts";
import type { BlogPost } from "@/lib/supabase/types";
import { Button, fileInputClass, inputClass, labelClass } from "@/components/admin/ui";

const BODY_PLACEHOLDER = `[
  { "type": "paragraph", "text": "Opening paragraph..." },
  { "type": "heading", "text": "A section heading" },
  { "type": "paragraph", "text": "More detail..." },
  { "type": "list", "items": ["Point one", "Point two"] },
  { "type": "related", "heading": "Related guide", "items": [
    { "title": "Article title to link to", "href": "/en/blog/some-other-slug" }
  ] }
]`;

const FAQ_PLACEHOLDER = `[
  { "q": "A question a reader would actually search for?", "a": "A direct, concise answer." }
]`;

export default function BlogPostForm({
  postId,
  initial,
}: {
  postId?: string;
  initial?: BlogPost;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? locales[0]);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [excerpt, setExcerpt] = useState(initial?.excerpt ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [bodyText, setBodyText] = useState(
    initial ? JSON.stringify(initial.body, null, 2) : BODY_PLACEHOLDER
  );
  const [faqText, setFaqText] = useState(
    initial ? JSON.stringify(initial.faq, null, 2) : FAQ_PLACEHOLDER
  );
  const [authorName, setAuthorName] = useState(initial?.author_name ?? "Vishal Saini");
  const [authorTitle, setAuthorTitle] = useState(initial?.author_title ?? "Founder, The Unique Choice");
  const [authorBio, setAuthorBio] = useState(initial?.author_bio ?? "");
  const [readTime, setReadTime] = useState(initial?.read_time ?? "");
  const [status, setStatus] = useState<BlogPost["status"]>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(initial?.published_at ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [imageAlt, setImageAlt] = useState("");
  const [imageCaption, setImageCaption] = useState("");
  const [imageUploading, setImageUploading] = useState(false);
  const [imageError, setImageError] = useState("");

  async function handleInsertImage() {
    setImageError("");
    const file = imageInputRef.current?.files?.[0];
    if (!file) {
      setImageError("Choose an image file first.");
      return;
    }
    if (!imageAlt.trim()) {
      setImageError("Alt text is required — it describes the image for accessibility and SEO.");
      return;
    }

    let body;
    try {
      body = JSON.parse(bodyText);
      if (!Array.isArray(body)) throw new Error();
    } catch {
      setImageError("Body isn't valid JSON right now — fix it before adding an image.");
      return;
    }

    setImageUploading(true);
    try {
      const fd = new FormData();
      fd.set("image", file);
      const result = await uploadBlogImage(fd);
      if (!result.ok || !result.url) {
        setImageError(result.message);
        return;
      }
      body.push({
        type: "image",
        url: result.url,
        alt: imageAlt.trim(),
        ...(imageCaption.trim() ? { caption: imageCaption.trim() } : {}),
      });
      setBodyText(JSON.stringify(body, null, 2));
      if (imageInputRef.current) imageInputRef.current.value = "";
      setImageAlt("");
      setImageCaption("");
    } catch (err) {
      setImageError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setImageUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let body;
    try {
      body = JSON.parse(bodyText);
      if (!Array.isArray(body)) throw new Error("Body must be a JSON array of blocks.");
    } catch (err) {
      setError(`Body is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    let faq;
    try {
      faq = JSON.parse(faqText);
      if (!Array.isArray(faq)) throw new Error("FAQ must be a JSON array of {q, a} items.");
    } catch (err) {
      setError(`FAQ is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        slug,
        locale,
        title,
        excerpt,
        summary,
        body,
        faq,
        author_name: authorName,
        author_title: authorTitle,
        author_bio: authorBio,
        read_time: readTime,
        status,
        published_at: publishedAt || null,
      };
      if (postId) {
        await updateBlogPost(postId, input);
      } else {
        await createBlogPost(input);
      }
      router.push("/admin/blog");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Slug *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="how-to-find-reliable-suppliers-in-china"
            required
            className={inputClass}
          />
          <p className="mt-1 text-[11px] text-gray-400">Same slug across locales links the translations together.</p>
        </div>
        <div>
          <label className={labelClass}>Locale *</label>
          <select value={locale} onChange={(e) => setLocale(e.target.value)} className={inputClass}>
            {locales.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Excerpt *</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>TL;DR summary *</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div className="rounded-xl border border-dashed border-gray-300 p-3">
        <label className={labelClass}>Add an image to the body</label>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            ref={imageInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className={`${fileInputClass} sm:w-56`}
          />
          <input
            value={imageAlt}
            onChange={(e) => setImageAlt(e.target.value)}
            placeholder="Alt text (required)"
            className={inputClass}
          />
          <input
            value={imageCaption}
            onChange={(e) => setImageCaption(e.target.value)}
            placeholder="Caption (optional)"
            className={inputClass}
          />
          <Button type="button" variant="secondary" size="sm" onClick={handleInsertImage} disabled={imageUploading} className="shrink-0">
            {imageUploading ? "Uploading..." : "Upload & insert"}
          </Button>
        </div>
        {imageError && <p className="mt-1.5 text-xs text-red-500">{imageError}</p>}
        <p className="mt-1.5 text-[11px] text-gray-400">
          Uploads the file to storage and appends an image block to the end of the Body JSON below — move it in the JSON if it belongs elsewhere in the article.
        </p>
      </div>

      <div>
        <label className={labelClass}>Body (JSON array of blocks) *</label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={14}
          required
          className={`resize-y font-mono text-xs ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Each block: {"{ type: \"paragraph\"|\"heading\", text }"}, {"{ type: \"list\", items: [...] }"},
          {" "}{"{ type: \"related\", heading, items: [{ title, href }] }"} for internal links to other articles, or
          {" "}{"{ type: \"image\", url, alt, caption? }"} — use the uploader above instead of hand-writing this
          one; it fills in a validated URL for you.
        </p>
      </div>

      <div>
        <label className={labelClass}>FAQ (JSON array of question/answer pairs)</label>
        <textarea
          value={faqText}
          onChange={(e) => setFaqText(e.target.value)}
          rows={6}
          className={`resize-y font-mono text-xs ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Renders as an FAQ section on the article and adds FAQPage schema. Leave as {"[]"} to skip.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Author name"
          required
          className={inputClass}
        />
        <input
          value={authorTitle}
          onChange={(e) => setAuthorTitle(e.target.value)}
          placeholder="Author title"
          required
          className={inputClass}
        />
        <input
          value={readTime}
          onChange={(e) => setReadTime(e.target.value)}
          placeholder="8 min read"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Author bio *</label>
        <textarea
          value={authorBio}
          onChange={(e) => setAuthorBio(e.target.value)}
          rows={2}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as BlogPost["status"])}
            className={inputClass}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Published date</label>
          <input
            type="date"
            value={publishedAt ?? ""}
            onChange={(e) => setPublishedAt(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-2 w-fit">
        {submitting ? "Saving..." : postId ? "Save changes" : "Create post"}
      </Button>
    </form>
  );
}
