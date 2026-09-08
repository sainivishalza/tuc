"use client";

import { useState } from "react";
import { Sparkles, ArrowDown } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { matchPlan, type SupplierAnswer, type CustomAnswer, type ScaleAnswer } from "@/lib/planMatcher";

const OPTION_CLASS =
  "w-full rounded-xl border-2 border-border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 hover:border-accent/50";

export default function PlanMatchQuiz({ dict }: { dict: Dictionary }) {
  const t = dict.tools.planMatch;
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
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-8">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            {!plan && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-semibold">{t.q1}</h3>
                <button className={OPTION_CLASS} onClick={() => setSupplier("have_supplier")}>
                  {t.q1Options.have}
                </button>
                <button className={OPTION_CLASS} onClick={() => setSupplier("need_sourcing")}>
                  {t.q1Options.need}
                </button>
              </div>
            )}

            {!plan && supplier && !custom && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">{t.q2}</h3>
                <button className={OPTION_CLASS} onClick={() => setCustom("no")}>
                  {t.q2Options.no}
                </button>
                <button className={OPTION_CLASS} onClick={() => setCustom("yes")}>
                  {t.q2Options.yes}
                </button>
              </div>
            )}

            {!plan && supplier && custom && !scale && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">{t.q3}</h3>
                <button className={OPTION_CLASS} onClick={() => setScale("one")}>
                  {t.q3Options.one}
                </button>
                <button className={OPTION_CLASS} onClick={() => setScale("multiple_ongoing")}>
                  {t.q3Options.multiple}
                </button>
              </div>
            )}

            {plan && planIndex !== null && (
              <Reveal delay={0}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Sparkles size={18} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">
                    {t.recommended} {plan.name}
                  </h3>
                  <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-bold text-accent">
                    {plan.commission}
                    {plan.commission !== "Custom" ? t.commissionSuffix : ""}
                  </span>
                </div>
                <p className="mt-3 text-sm text-muted">{t.reasons[String(planIndex) as "0" | "1" | "2"]}</p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={reset}
                    className="rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-2"
                  >
                    {t.startOver}
                  </button>
                  <button
                    onClick={handleSeePlan}
                    className="brand-gradient-animated flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    {t.seePlanDetails.replace("{plan}", plan.name)}
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
