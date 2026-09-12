"use client";

import { useEffect, useState } from "react";
import { Calculator, ArrowRight, Tag } from "lucide-react";
import Reveal from "./Reveal";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { getCategoryProfiles } from "@/lib/productMatcher";
import { getDestinations, getShippingMethods, calculateLandedCost, type LandedCostResult } from "@/lib/landedCost";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function LandedCostCalculator({
  dict,
  onNavigate,
}: {
  dict: Dictionary;
  /** Switches the parent Free Tools tab group to another tool's tab —
   * used by "Estimate Selling Price" now that this tool lives in a tab
   * panel instead of its own scrollable section. */
  onNavigate?: (toolId: string) => void;
}) {
  const t = dict.tools.landedCostCalculator;
  const categories = getCategoryProfiles(dict.tools.categories);
  const destinations = getDestinations(dict.tools.destinations);
  const shippingMethods = getShippingMethods(dict.tools.shippingMethods);

  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [destinationId, setDestinationId] = useState(destinations[0].id);
  const [quantity, setQuantity] = useState("500");
  const [unitPrice, setUnitPrice] = useState("2.50");
  const [weightKg, setWeightKg] = useState("");
  const [methodId, setMethodId] = useState(shippingMethods[0].id);
  const [result, setResult] = useState<LandedCostResult | null>(null);
  const pathname = usePathname() ?? "/";

  const qty = Number(quantity);
  const price = Number(unitPrice);
  const weight = weightKg.trim() ? Number(weightKg) : null;
  const canCalculate = qty > 0 && price > 0;

  // Lets the CBM Calculator above hand off the total weight it computed
  // so the customer doesn't have to re-type it here.
  useEffect(() => {
    function handleCbmComputed(e: Event) {
      const detail = (e as CustomEvent<{ weightKg: number }>).detail;
      if (!detail) return;
      setWeightKg(String(Math.round(detail.weightKg)));
    }
    window.addEventListener("tuc:cbm-computed", handleCbmComputed);
    return () => window.removeEventListener("tuc:cbm-computed", handleCbmComputed);
  }, []);

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResult(
      calculateLandedCost(
        { categoryId, destinationId, quantity: qty, unitPrice: price, weightKg: weight, methodId },
        destinations,
        shippingMethods
      )
    );
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("Landed Cost Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: {
          category: categoryId,
          message: t.quoteMessage
            .replace("{quantity}", quantity)
            .replace("{unitPrice}", unitPrice)
            .replace("{destination}", result.destination.label)
            .replace("{low}", formatUsd(result.total.low))
            .replace("{high}", formatUsd(result.total.high)),
        },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEstimateSellingPrice = () => {
    if (!result) return;
    trackCtaClick("Landed Cost Estimate Selling Price", pathname);
    const costPerUnit = (result.total.low + result.total.high) / 2 / qty;
    window.dispatchEvent(new CustomEvent("tuc:landed-cost-computed", { detail: { costPerUnit, quantity: qty } }));
    if (onNavigate) onNavigate("selling-price");
    else document.getElementById("selling-price")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <Reveal delay={0.05}>
      <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t.categoryLabel}</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.destinationLabel}</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {destinations.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.quantityLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.unitPriceLabel}</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.shippingMethodLabel}</label>
                <select
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {shippingMethods.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.weightLabel}</label>
                <input
                  type="number"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder={t.weightPlaceholder}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="btn-primary mt-6"
            >
              <Calculator size={16} />
              {t.calculateButton}
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.productValue}</dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.productValue)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {t.estimatedDuty.replace("{low}", String(result.dutyRate.low)).replace("{high}", String(result.dutyRate.high))}
                      </dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.duty.low)} – {formatUsd(result.duty.high)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">{t.estimatedFreight}</dt>
                      <dd className="mt-1 text-sm">
                        {result.freight
                          ? `${formatUsd(result.freight.low)} – ${formatUsd(result.freight.high)}`
                          : t.freightFallback}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        {result.destination.taxLabel} ({result.destination.taxRate}%)
                      </dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.tax.low)} – {formatUsd(result.tax.high)}</dd>
                    </div>
                  </dl>

                  <div className="mt-5 rounded-lg bg-accent/10 px-4 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{t.estimatedTotal}</p>
                    <p className="font-display mt-1 text-2xl font-bold">
                      {formatUsd(result.total.low)} – {formatUsd(result.total.high)}
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-muted">
                    {t.disclaimer.replace("{taxNote}", result.destination.taxNote)}
                  </p>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={handleEstimateSellingPrice}
                      className="glass-strong flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-foreground transition hover:opacity-80"
                    >
                      <Tag size={16} />
                      {t.estimateSellingPrice}
                    </button>
                    <button
                      onClick={handleGetQuote}
                      className="btn-primary"
                    >
                      {t.getExactQuote}
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
