"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createCategoryPage, updateCategoryPage } from "@/lib/actions/categoryPages";
import type { CategoryPage } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const HIGHLIGHTS_PLACEHOLDER = `[
  "Sample sourcing and factory shortlisting",
  "Quality inspection before shipment",
  "Consolidated shipping and customs paperwork"
]`;

const FAQ_PLACEHOLDER = `[
  { "q": "A question a reader would actually search for?", "a": "A direct, concise answer." }
]`;

export default function CategoryPageForm({
  categoryId,
  initial,
}: {
  categoryId?: string;
  initial?: CategoryPage;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? locales[0]);
  const [name, setName] = useState(initial?.name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [intro, setIntro] = useState(initial?.intro ?? "");
  const [highlightsText, setHighlightsText] = useState(
    initial ? JSON.stringify(initial.highlights, null, 2) : HIGHLIGHTS_PLACEHOLDER
  );
  const [faqText, setFaqText] = useState(
    initial ? JSON.stringify(initial.faq, null, 2) : FAQ_PLACEHOLDER
  );
  const [status, setStatus] = useState<CategoryPage["status"]>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(initial?.published_at ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let highlights;
    try {
      highlights = JSON.parse(highlightsText);
      if (!Array.isArray(highlights)) throw new Error("Highlights must be a JSON array of strings.");
    } catch (err) {
      setError(`Highlights is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
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
        name,
        tagline,
        intro,
        highlights,
        faq,
        status,
        published_at: publishedAt || null,
      };
      if (categoryId) {
        await updateCategoryPage(categoryId, input);
      } else {
        await createCategoryPage(input);
      }
      router.push("/admin/categories");
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
            placeholder="electronics-gadgets"
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
        <label className={labelClass}>Category name *</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Electronics & Gadgets"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Tagline *</label>
        <textarea
          value={tagline}
          onChange={(e) => setTagline(e.target.value)}
          rows={2}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Intro paragraph *</label>
        <textarea
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          rows={4}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Highlights (JSON array of strings) *</label>
        <textarea
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
          rows={8}
          required
          className={`resize-y font-mono text-xs ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Rendered as a bulleted &quot;What we handle&quot; list on the category page.
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
          Renders as an FAQ section on the page and adds FAQPage schema. Leave as {"[]"} to skip.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CategoryPage["status"])}
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
        {submitting ? "Saving..." : categoryId ? "Save changes" : "Create category page"}
      </Button>
    </form>
  );
}
