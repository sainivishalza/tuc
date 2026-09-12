"use client";

import { useState } from "react";
import { Boxes, ArrowRight, ArrowDownToLine } from "lucide-react";
import Reveal from "./Reveal";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { calculateCbm, type CbmResult } from "@/lib/cbmCalculator";

export default function CbmCalculator({
  dict,
  onNavigate,
}: {
  dict: Dictionary;
  /** Switches the parent Free Tools tab group to another tool's tab —
   * used by "Use Weight in Landed Cost Calculator" now that this tool
   * lives in a tab panel instead of its own scrollable section. */
  onNavigate?: (toolId: string) => void;
}) {
  const t = dict.tools.cbmCalculator;
  const [length, setLength] = useState("40");
  const [width, setWidth] = useState("30");
  const [height, setHeight] = useState("25");
  const [weight, setWeight] = useState("8");
  const [cartons, setCartons] = useState("100");
  const [result, setResult] = useState<CbmResult | null>(null);
  const pathname = usePathname() ?? "/";

  const l = Number(length);
  const w = Number(width);
  const h = Number(height);
  const wt = Number(weight);
  const ct = Number(cartons);
  const canCalculate = l > 0 && w > 0 && h > 0 && wt > 0 && ct > 0;

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResult(calculateCbm({ lengthCm: l, widthCm: w, heightCm: h, weightKgPerCarton: wt, cartons: ct }));
  };

  const handleUseInLandedCost = () => {
    if (!result) return;
    window.dispatchEvent(new CustomEvent("tuc:cbm-computed", { detail: { weightKg: result.totalWeightKg } }));
    if (onNavigate) onNavigate("landed-cost");
    else document.getElementById("landed-cost")?.scrollIntoView({ behavior: "smooth" });
  };

  function recommendationText(r: CbmResult): string {
    switch (r.recommendation.kind) {
      case "air": return t.recommendation.air;
      case "lcl": return t.recommendation.lcl;
      case "compare20": return t.recommendation.compare20;
      case "fcl40": return t.recommendation.fcl40;
      case "multiple40": return t.recommendation.multiple40.replace("{n}", String(r.recommendation.containers));
    }
  }

  function containerNote(r: CbmResult): string | null {
    switch (r.recommendation.kind) {
      case "compare20": return t.fits20;
      case "fcl40": return t.fits40;
      case "multiple40": return t.about40Note.replace("{n}", String(r.recommendation.containers));
      default: return null;
    }
  }

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("CBM Calculator Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: {
          message: t.quoteMessage
            .replace("{cbm}", result.totalVolumeM3.toFixed(2))
            .replace("{weight}", String(Math.round(result.totalWeightKg)))
            .replace("{cartons}", cartons)
            .replace("{dims}", `${length}×${width}×${height}`)
            .replace("{perCarton}", weight)
            .replace("{recommendation}", recommendationText(result)),
        },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Reveal delay={0.05}>
      <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">{t.lengthLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.widthLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.heightLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.weightLabel}</label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div className="col-span-2">
                <label className="mb-2 block text-sm font-medium">{t.cartonsLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={cartons}
                  onChange={(e) => setCartons(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="btn-primary mt-6"
            >
              <Boxes size={16} />
              {t.calculateButton}
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.totalVolume}</dt>
                      <dd className="mt-1 text-sm">{result.totalVolumeM3.toFixed(2)} CBM</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.totalWeight}</dt>
                      <dd className="mt-1 text-sm">{Math.round(result.totalWeightKg).toLocaleString()} kg</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.chargeableWeight}</dt>
                      <dd className="mt-1 text-sm">{Math.round(result.chargeableWeightKg).toLocaleString()} kg</dd>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-lg bg-accent/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.recommended}</p>
                    <p className="font-display mt-1 text-lg font-semibold">{recommendationText(result)}</p>
                    {containerNote(result) && <p className="mt-1 text-sm text-muted">{containerNote(result)}</p>}
                  </div>

                  <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                    {result.isBulky
                      ? t.tipBulky
                          .replace("{volumetric}", Math.round(result.volumetricWeightKg).toLocaleString())
                          .replace("{actual}", Math.round(result.totalWeightKg).toLocaleString())
                      : t.tipDense}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={handleUseInLandedCost}
                      className="glass-strong flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground transition hover:opacity-80"
                    >
                      <ArrowDownToLine size={16} />
                      {t.useInLandedCost}
                    </button>
                    <button
                      onClick={handleGetQuote}
                      className="btn-primary mt-5"
                    >
                      {t.getQuote}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </Reveal>
            )}
      </div>
    </Reveal>
  );
}
