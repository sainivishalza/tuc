"use client";

import { useEffect, useState } from "react";
import { Tag, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { calculateSellingPrice, type SellingPriceResult } from "@/lib/pricingCalculator";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}

export default function SellingPriceCalculator({ dict }: { dict: Dictionary }) {
  const t = dict.tools.sellingPriceCalculator;
  const [landedCost, setLandedCost] = useState("5.00");
  const [fulfillment, setFulfillment] = useState("0");
  const [marginPct, setMarginPct] = useState("30");
  const [feePct, setFeePct] = useState("0");
  const [quantity, setQuantity] = useState("500");
  const [result, setResult] = useState<SellingPriceResult | null | "invalid">(null);
  const pathname = usePathname() ?? "/";

  // Lets the Landed Cost Calculator above hand off its computed cost per
  // unit (and quantity) so this tool picks up right where that one left
  // off, instead of asking the customer to redo the math by hand.
  useEffect(() => {
    function handleLandedCost(e: Event) {
      const detail = (e as CustomEvent<{ costPerUnit: number; quantity: number }>).detail;
      if (!detail) return;
      setLandedCost(detail.costPerUnit.toFixed(2));
      setQuantity(String(detail.quantity));
    }
    window.addEventListener("tuc:landed-cost-computed", handleLandedCost);
    return () => window.removeEventListener("tuc:landed-cost-computed", handleLandedCost);
  }, []);

  const cost = Number(landedCost);
  const fulfill = Number(fulfillment);
  const margin = Number(marginPct);
  const fee = Number(feePct);
  const qty = Number(quantity);
  const canCalculate = cost > 0 && fulfill >= 0 && margin > 0 && margin < 100 && fee >= 0 && qty > 0;

  const handleCalculate = () => {
    if (!canCalculate) return;
    const calc = calculateSellingPrice({
      landedCostPerUnit: cost,
      fulfillmentCostPerUnit: fulfill,
      marginPct: margin,
      feePct: fee,
      quantity: qty,
    });
    setResult(calc ?? "invalid");
  };

  const handleGetQuote = () => {
    trackCtaClick("Selling Price Get Quote", pathname);
    window.dispatchEvent(new CustomEvent("tuc:quote-prefill", { detail: { message: t.quoteMessage } }));
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="selling-price" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t.landedCostLabel}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={landedCost}
                  onChange={(e) => setLandedCost(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.fulfillmentLabel}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fulfillment}
                  onChange={(e) => setFulfillment(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-muted">{t.fulfillmentHint}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.marginLabel}</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={marginPct}
                  onChange={(e) => setMarginPct(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-muted">{t.marginHint}</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.feeLabel}</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={feePct}
                  onChange={(e) => setFeePct(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-muted">{t.feeHint}</p>
              </div>
              <div className="col-span-full sm:max-w-[calc(50%-0.5rem)]">
                <label className="mb-2 block text-sm font-medium">{t.quantityLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Tag size={16} />
              {t.calculateButton}
            </button>

            {result === "invalid" && (
              <p className="mt-6 rounded-lg bg-red-500/10 px-4 py-3 text-sm text-red-600">{t.invalidResult}</p>
            )}

            {result && result !== "invalid" && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="rounded-lg bg-accent/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.suggestedPrice}</p>
                    <p className="font-display mt-1 text-2xl font-bold">{formatUsd(result.sellingPrice)}</p>
                  </div>

                  <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.profitPerUnit}</dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.profitPerUnit)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.markup}</dt>
                      <dd className="mt-1 text-sm">{result.markupPct.toFixed(0)}%</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {t.totalProfit.replace("{quantity}", quantity)}
                      </dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.totalProfit)}</dd>
                    </div>
                  </dl>

                  <p className="mt-5 text-xs text-muted">{t.explainer}</p>

                  <button
                    onClick={handleGetQuote}
                    className="brand-gradient-animated mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    {t.getQuote}
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
