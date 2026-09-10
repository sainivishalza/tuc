"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { locales } from "@/lib/i18n";
import { createShippingRoute, updateShippingRoute } from "@/lib/actions/shippingRoutes";
import type { ShippingRoute } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const HIGHLIGHTS_PLACEHOLDER = `[
  "Consolidated LCL and dedicated FCL options",
  "Customs clearance handled end-to-end",
  "Door-to-door delivery available"
]`;

const FAQ_PLACEHOLDER = `[
  { "q": "A question a reader would actually search for?", "a": "A direct, concise answer." }
]`;

export default function ShippingRouteForm({
  routeId,
  initial,
}: {
  routeId?: string;
  initial?: ShippingRoute;
}) {
  const router = useRouter();
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [locale, setLocale] = useState(initial?.locale ?? locales[0]);
  const [destinationName, setDestinationName] = useState(initial?.destination_name ?? "");
  const [tagline, setTagline] = useState(initial?.tagline ?? "");
  const [intro, setIntro] = useState(initial?.intro ?? "");
  const [seaTransit, setSeaTransit] = useState(initial?.sea_transit ?? "");
  const [airTransit, setAirTransit] = useState(initial?.air_transit ?? "");
  const [expressTransit, setExpressTransit] = useState(initial?.express_transit ?? "");
  const [highlightsText, setHighlightsText] = useState(
    initial ? JSON.stringify(initial.highlights, null, 2) : HIGHLIGHTS_PLACEHOLDER
  );
  const [faqText, setFaqText] = useState(
    initial ? JSON.stringify(initial.faq, null, 2) : FAQ_PLACEHOLDER
  );
  const [status, setStatus] = useState<ShippingRoute["status"]>(initial?.status ?? "draft");
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
        destination_name: destinationName,
        tagline,
        intro,
        sea_transit: seaTransit,
        air_transit: airTransit,
        express_transit: expressTransit,
        highlights,
        faq,
        status,
        published_at: publishedAt || null,
      };
      if (routeId) {
        await updateShippingRoute(routeId, input);
      } else {
        await createShippingRoute(input);
      }
      router.push("/admin/shipping-routes");
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
            placeholder="united-states"
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
        <label className={labelClass}>Destination name *</label>
        <input
          value={destinationName}
          onChange={(e) => setDestinationName(e.target.value)}
          placeholder="United States"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Sea freight transit *</label>
          <input
            value={seaTransit}
            onChange={(e) => setSeaTransit(e.target.value)}
            placeholder="25–35 days"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Air freight transit *</label>
          <input
            value={airTransit}
            onChange={(e) => setAirTransit(e.target.value)}
            placeholder="7–10 days"
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Express transit *</label>
          <input
            value={expressTransit}
            onChange={(e) => setExpressTransit(e.target.value)}
            placeholder="3–5 days"
            required
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label className={labelClass}>Highlights (JSON array of strings) *</label>
        <textarea
          value={highlightsText}
          onChange={(e) => setHighlightsText(e.target.value)}
          rows={6}
          required
          className={`resize-y font-mono text-xs ${inputClass}`}
        />
        <p className="mt-1 text-[11px] text-gray-400">
          Rendered as a bulleted list on the route page.
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
            onChange={(e) => setStatus(e.target.value as ShippingRoute["status"])}
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
        {submitting ? "Saving..." : routeId ? "Save changes" : "Create route page"}
      </Button>
    </form>
  );
}
