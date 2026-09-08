"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Loader2 } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { matchProduct, type MatchResult } from "@/lib/productMatcher";
import { CategoryBadge } from "./categoryVisuals";

const TIMELINE_LABELS: Record<string, string> = {
  asap: "ASAP",
  "1month": "Within 1 month",
  "3months": "Within 3 months",
  exploring: "Just exploring",
};

const CONFIDENCE_STYLES: Record<MatchResult["confidence"], string> = {
  high: "bg-green-500/15 text-green-600",
  medium: "bg-amber-500/15 text-amber-600",
  low: "bg-surface-2 text-muted",
};

const CONFIDENCE_LABELS: Record<MatchResult["confidence"], string> = {
  high: "Strong match",
  medium: "Likely match",
  low: "Best guess",
};

const EXAMPLE_PLACEHOLDER =
  "e.g. \"I need 2,000 waterproof LED strip lights for outdoor use, CE certified, timeline is next month.\"";

export default function ProductMatcher() {
  const [description, setDescription] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);
  const pathname = usePathname() ?? "/";

  const handleAnalyze = () => {
    if (description.trim().length < 6) return;
    setAnalyzing(true);
    setResult(null);
    // Brief, honest processing delay — the match itself runs instantly and
    // entirely in the browser (no external API), this just gives the
    // result a moment to render as a distinct step rather than a flash.
    setTimeout(() => {
      setResult(matchProduct(description));
      setAnalyzing(false);
    }, 500);
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("Smart Match Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: { category: result.profile.id, message: description.trim() },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="smart-match" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · Instant Match"
          title="Not Sure Where to Start? Describe It."
          subtitle="Our sourcing-match engine reads your description and instantly returns the right category plus agent-level guidance — no signup, no cost, no waiting."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <label className="mb-2 block text-sm font-medium">
              What are you trying to source?
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={EXAMPLE_PLACEHOLDER}
              rows={3}
              className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              onClick={handleAnalyze}
              disabled={description.trim().length < 6 || analyzing}
              className="brand-gradient mt-4 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              {analyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Analyzing your request...
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  Analyze My Request
                </>
              )}
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <CategoryBadge id={result.profile.id} />
                    <h3 className="font-display text-lg font-semibold">
                      {result.profile.label}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${CONFIDENCE_STYLES[result.confidence]}`}
                    >
                      {CONFIDENCE_LABELS[result.confidence]}
                    </span>
                  </div>

                  {(result.quantity || result.timelineId || result.requirements.length > 0) && (
                    <div className="mt-4 flex flex-wrap gap-2">
                      {result.quantity && (
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                          Qty: {result.quantity}
                        </span>
                      )}
                      {result.timelineId && (
                        <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                          {TIMELINE_LABELS[result.timelineId]}
                        </span>
                      )}
                      {result.requirements.map((req) => (
                        <span
                          key={req}
                          className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium text-foreground"
                        >
                          {req}
                        </span>
                      ))}
                    </div>
                  )}

                  <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Typical MOQ
                      </dt>
                      <dd className="mt-1 text-sm">{result.profile.moq}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Typical Lead Time
                      </dt>
                      <dd className="mt-1 text-sm">{result.profile.leadTime}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Certifications
                      </dt>
                      <dd className="mt-1 text-sm">{result.profile.certs}</dd>
                    </div>
                  </dl>

                  <p className="mt-5 rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                    <strong className="text-foreground">Agent tip:</strong> {result.profile.tip}
                  </p>

                  <button
                    onClick={handleGetQuote}
                    className="brand-gradient-animated mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get a Quote for {result.profile.label}
                    <ArrowRight size={16} />
                  </button>
                </div>
              </Reveal>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
