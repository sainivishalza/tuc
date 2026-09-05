"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createBlogPost, updateBlogPost } from "@/lib/actions/blogPosts";
import type { BlogPost } from "@/lib/supabase/types";

const BODY_PLACEHOLDER = `[
  { "type": "paragraph", "text": "Opening paragraph..." },
  { "type": "heading", "text": "A section heading" },
  { "type": "paragraph", "text": "More detail..." },
  { "type": "list", "items": ["Point one", "Point two"] },
  { "type": "related", "heading": "Related guide", "items": [
    { "title": "Article title to link to", "href": "/en/blog/some-other-slug" }
  ] }
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
  const [authorName, setAuthorName] = useState(initial?.author_name ?? "Vishal Saini");
  const [authorTitle, setAuthorTitle] = useState(initial?.author_title ?? "Founder, The Unique Choice");
  const [authorBio, setAuthorBio] = useState(initial?.author_bio ?? "");
  const [readTime, setReadTime] = useState(initial?.read_time ?? "");
  const [status, setStatus] = useState<BlogPost["status"]>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(initial?.published_at ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

    setSubmitting(true);
    try {
      const input = {
        slug,
        locale,
        title,
        excerpt,
        summary,
        body,
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
    <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Slug *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="how-to-find-reliable-suppliers-in-china"
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <p className="mt-1 text-[11px] text-gray-400">Same slug across locales links the translations together.</p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-gray-700">Locale *</label>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {locales.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Title *</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Excerpt *</label>
        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          rows={2}
          required
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">TL;DR summary *</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          required
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">
          Body (JSON array of blocks) *
        </label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          rows={14}
          required
          className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2 font-mono text-xs"
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Each block: {"{ type: \"paragraph\"|\"heading\", text }"}, {"{ type: \"list\", items: [...] }"}, or
          {" "}{"{ type: \"related\", heading, items: [{ title, href }] }"} for internal links to other articles.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <input
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Author name"
          required
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={authorTitle}
          onChange={(e) => setAuthorTitle(e.target.value)}
          placeholder="Author title"
          required
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
        <input
          value={readTime}
          onChange={(e) => setReadTime(e.target.value)}
          placeholder="8 min read"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="mb-1 block text-xs font-semibold text-gray-700">Author bio *</label>
        <textarea
          value={authorBio}
          onChange={(e) => setAuthorBio(e.target.value)}
          rows={2}
          required
          className="w-full resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as BlogPost["status"])}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
        <input
          type="date"
          value={publishedAt ?? ""}
          onChange={(e) => setPublishedAt(e.target.value)}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        />
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="mt-2 rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-60"
      >
        {submitting ? "Saving..." : postId ? "Save changes" : "Create post"}
      </button>
    </form>
  );
}
