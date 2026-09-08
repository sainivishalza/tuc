"use client";

import { useState } from "react";
import { Sparkles, ArrowDown } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import {
  matchPlan,
  PLAN_REASONS,
  type SupplierAnswer,
  type CustomAnswer,
  type ScaleAnswer,
} from "@/lib/planMatcher";

const OPTION_CLASS =
  "w-full rounded-xl border-2 border-border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 hover:border-accent/50";

export default function PlanMatchQuiz({ dict }: { dict: Dictionary }) {
  const [supplier, setSupplier] = useState<SupplierAnswer | null>(null);
  const [custom, setCustom] = useState<CustomAnswer | null>(null);
  const [scale, setScale] = useState<ScaleAnswer | null>(null);
  const pathname = usePathname() ?? "/";

  const planIndex = supplier && custom && scale ? matchPlan(supplier, custom, scale) : null;
  const plan = planIndex !== null ? dict.pricing.plans[planIndex] : null;

  const reset = () => {
    setSupplier(null);
    setCustom(null);
    setScale(null);
  };

  const handleSeePlan = () => {
    trackCtaClick("Plan Match See Plan", pathname);
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="px-4 pb-4 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <SectionHeading
          badge="Free · 3-Question Match"
          title="Not Sure Which Plan Fits?"
          subtitle="Answer three quick questions and we'll point you to the right tier — no need to compare commission percentages yourself."
        />

        <Reveal delay={0.15} className="mt-8">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            {!plan && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-semibold">
                  Do you already have a factory or supplier in China, or do you need help finding one?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setSupplier("have_supplier")}>
                  I already have a supplier
                </button>
                <button className={OPTION_CLASS} onClick={() => setSupplier("need_sourcing")}>
                  I need help finding one
                </button>
              </div>
            )}

            {!plan && supplier && !custom && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">
                  Do you need custom branding, private labeling, or product development on top of sourcing?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setCustom("no")}>
                  No, just sourcing an existing product
                </button>
                <button className={OPTION_CLASS} onClick={() => setCustom("yes")}>
                  Yes, I want custom branding or development
                </button>
              </div>
            )}

            {!plan && supplier && custom && !scale && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">
                  How many suppliers or product lines will you need managed at once?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setScale("one")}>
                  Just one, for now
                </button>
                <button className={OPTION_CLASS} onClick={() => setScale("multiple_ongoing")}>
                  Multiple, on an ongoing basis
                </button>
              </div>
            )}

            {plan && planIndex !== null && (
              <Reveal delay={0}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">Recommended: {plan.name}</h3>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                    {plan.commission}
                    {plan.commission !== "Custom" ? " commission" : ""}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{PLAN_REASONS[planIndex]}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={reset}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-2"
                  >
                    Start over
                  </button>
                  <button
                    onClick={handleSeePlan}
                    className="brand-gradient-animated flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    See {plan.name} Plan Details
                    <ArrowDown size={16} />
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
