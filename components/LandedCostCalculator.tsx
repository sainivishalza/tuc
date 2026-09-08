"use client";

import { useState } from "react";
import { Calculator, ArrowRight } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { CATEGORY_PROFILES } from "@/lib/productMatcher";
import { DESTINATIONS, SHIPPING_METHODS, calculateLandedCost, type LandedCostResult } from "@/lib/landedCost";

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export default function LandedCostCalculator() {
  const [categoryId, setCategoryId] = useState(CATEGORY_PROFILES[0].id);
  const [destinationId, setDestinationId] = useState(DESTINATIONS[0].id);
  const [quantity, setQuantity] = useState("500");
  const [unitPrice, setUnitPrice] = useState("2.50");
  const [weightKg, setWeightKg] = useState("");
  const [methodId, setMethodId] = useState(SHIPPING_METHODS[0].id);
  const [result, setResult] = useState<LandedCostResult | null>(null);
  const pathname = usePathname() ?? "/";

  const qty = Number(quantity);
  const price = Number(unitPrice);
  const weight = weightKg.trim() ? Number(weightKg) : null;
  const canCalculate = qty > 0 && price > 0;

  const handleCalculate = () => {
    if (!canCalculate) return;
    setResult(calculateLandedCost({ categoryId, destinationId, quantity: qty, unitPrice: price, weightKg: weight, methodId }));
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("Landed Cost Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: {
          category: categoryId,
          message: `Estimated landed cost for ${quantity} units at $${unitPrice}/unit to ${result.destination.label}: ${formatUsd(result.total.low)}–${formatUsd(result.total.high)}. Please confirm exact numbers.`,
        },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="landed-cost" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · Instant Estimate"
          title="Estimate Your Landed Cost"
          subtitle="Get a ballpark of duty, freight, and import tax before you commit — plug in your numbers and see a total range in seconds."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Product category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {CATEGORY_PROFILES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Destination</label>
                <select
                  value={destinationId}
                  onChange={(e) => setDestinationId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {DESTINATIONS.map((dest) => (
                    <option key={dest.id} value={dest.id}>
                      {dest.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Unit price (USD)</label>
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
                <label className="mb-2 block text-sm font-medium">Shipping method</label>
                <select
                  value={methodId}
                  onChange={(e) => setMethodId(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  {SHIPPING_METHODS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Total weight in kg (optional)</label>
                <input
                  type="number"
                  min="0"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  placeholder="Leave blank to skip freight estimate"
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleCalculate}
              disabled={!canCalculate}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Calculator size={16} />
              Calculate Landed Cost
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Product value</dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.productValue)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Estimated duty ({result.dutyRate.low}–{result.dutyRate.high}%)
                      </dt>
                      <dd className="mt-1 text-sm">{formatUsd(result.duty.low)} – {formatUsd(result.duty.high)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wider text-muted">Estimated freight</dt>
                      <dd className="mt-1 text-sm">
                        {result.freight
                          ? `${formatUsd(result.freight.low)} – ${formatUsd(result.freight.high)}`
                          : "Add a weight above to include freight"}
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
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">Estimated total landed cost</p>
                    <p className="font-display mt-1 text-2xl font-bold">
                      {formatUsd(result.total.low)} – {formatUsd(result.total.high)}
                    </p>
                  </div>

                  <p className="mt-4 text-xs text-muted">
                    Ballpark for budgeting only — {result.destination.taxNote} Exact duty depends on your product&apos;s
                    HS code. Request a quote for binding numbers confirmed by our customs broker.
                  </p>

                  <button
                    onClick={handleGetQuote}
                    className="brand-gradient-animated mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get an Exact Quote
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
