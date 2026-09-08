"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createGlossaryTerm, updateGlossaryTerm } from "@/lib/actions/glossaryTerms";
import type { GlossaryTerm } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

export default function GlossaryTermForm({
  termId,
  initial,
}: {
  termId?: string;
  initial?: GlossaryTerm;
}) {
  const router = useRouter();
  const [term, setTerm] = useState(initial?.term ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? locales[0]);
  const [definition, setDefinition] = useState(initial?.definition ?? "");
  const [status, setStatus] = useState<GlossaryTerm["status"]>(initial?.status ?? "draft");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const input = { term, slug, locale, definition, status };
      if (termId) {
        await updateGlossaryTerm(termId, input);
      } else {
        await createGlossaryTerm(input);
      }
      router.push("/admin/glossary");
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
          <label className={labelClass}>Anchor slug *</label>
          <input
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="moq"
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
        <label className={labelClass}>Term *</label>
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="MOQ (Minimum Order Quantity)"
          required
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Definition *</label>
        <textarea
          value={definition}
          onChange={(e) => setDefinition(e.target.value)}
          rows={5}
          required
          className={`resize-y ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as GlossaryTerm["status"])}
          className={inputClass}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-2 w-fit">
        {submitting ? "Saving..." : termId ? "Save changes" : "Create term"}
      </Button>
    </form>
  );
}
