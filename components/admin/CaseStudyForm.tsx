"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createCaseStudy, updateCaseStudy } from "@/lib/actions/caseStudies";
import type { CaseStudy } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const RESULTS_PLACEHOLDER = `[
  { "label": "Lead time reduced", "value": "35%" },
  { "label": "Unit cost saved", "value": "18%" }
]`;

export default function CaseStudyForm({
  caseStudyId,
  initial,
}: {
  caseStudyId?: string;
  initial?: CaseStudy;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? locales[0]);
  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [industry, setIndustry] = useState(initial?.industry ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [challenge, setChallenge] = useState(initial?.challenge ?? "");
  const [solution, setSolution] = useState(initial?.solution ?? "");
  const [resultsText, setResultsText] = useState(
    initial ? JSON.stringify(initial.results, null, 2) : RESULTS_PLACEHOLDER
  );
  const [status, setStatus] = useState<CaseStudy["status"]>(initial?.status ?? "draft");
  const [publishedAt, setPublishedAt] = useState(initial?.published_at ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    let results;
    try {
      results = JSON.parse(resultsText);
      if (!Array.isArray(results)) throw new Error("Results must be a JSON array of {label, value} items.");
    } catch (err) {
      setError(`Results is not valid JSON: ${err instanceof Error ? err.message : String(err)}`);
      return;
    }

    setSubmitting(true);
    try {
      const input = {
        slug,
        locale,
        client_name: clientName,
        industry,
        title,
        summary,
        challenge,
        solution,
        results,
        status,
        published_at: publishedAt || null,
      };
      if (caseStudyId) {
        await updateCaseStudy(caseStudyId, input);
      } else {
        await createCaseStudy(input);
      }
      router.push("/admin/case-studies");
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
            placeholder="electronics-brand-40pc-cost-reduction"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Client name *</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            placeholder="Real client name, or an anonymized label they've agreed to"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Industry *</label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Consumer Electronics"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Summary *</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          rows={2}
          required
          className={`resize-none ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">Short teaser shown on the listing page card.</p>
      </div>

      <div>
        <label className={labelClass}>Challenge *</label>
        <textarea
          value={challenge}
          onChange={(e) => setChallenge(e.target.value)}
          rows={4}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Solution *</label>
        <textarea
          value={solution}
          onChange={(e) => setSolution(e.target.value)}
          rows={4}
          required
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div>
        <label className={labelClass}>Results (JSON array of label/value pairs) *</label>
        <textarea
          value={resultsText}
          onChange={(e) => setResultsText(e.target.value)}
          rows={6}
          required
          className={`resize-y font-mono text-xs ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Only use real, verifiable figures from the actual project — these render as headline metrics on the page.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as CaseStudy["status"])}
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
        {submitting ? "Saving..." : caseStudyId ? "Save changes" : "Create case study"}
      </Button>
    </form>
  );
}
