"use client";

import { useState } from "react";
import { Boxes, ArrowRight, ArrowDownToLine } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { calculateCbm, type CbmResult } from "@/lib/cbmCalculator";

export default function CbmCalculator() {
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
    document.getElementById("landed-cost")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("CBM Calculator Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: {
          message: `Shipment is ${result.totalVolumeM3.toFixed(2)} CBM, ${Math.round(result.totalWeightKg)} kg total (${cartons} cartons at ${length}×${width}×${height}cm, ${weight}kg each). ${result.recommendation}`,
        },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="cbm-calculator" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · Instant Estimate"
          title="How Much Space Does Your Order Take?"
          subtitle="Enter your carton dimensions and quantity to get your total CBM, weight, and the right shipping method — before you commit to a freight quote."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium">Length (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Width (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Height (cm)</label>
                <input
                  type="number"
                  min="0"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Weight per carton (kg)</label>
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
                <label className="mb-2 block text-sm font-medium">Number of cartons</label>
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
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Boxes size={16} />
              Calculate CBM
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Total volume</dt>
                      <dd className="mt-1 text-sm">{result.totalVolumeM3.toFixed(2)} CBM</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Total weight</dt>
                      <dd className="mt-1 text-sm">{Math.round(result.totalWeightKg).toLocaleString()} kg</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Chargeable weight (air)</dt>
                      <dd className="mt-1 text-sm">{Math.round(result.chargeableWeightKg).toLocaleString()} kg</dd>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-lg bg-accent/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">Recommended</p>
                    <p className="font-display mt-1 text-lg font-semibold">{result.recommendation}</p>
                    {result.containerNote && <p className="mt-1 text-sm text-muted">{result.containerNote}</p>}
                  </div>

                  <p className="mt-4 rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">{result.tip}</p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={handleUseInLandedCost}
                      className="glass-strong flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground transition hover:opacity-80"
                    >
                      <ArrowDownToLine size={16} />
                      Use Weight in Landed Cost Calculator
                    </button>
                    <button
                      onClick={handleGetQuote}
                      className="brand-gradient-animated flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                    >
                      Get a Quote
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              </Reveal>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
