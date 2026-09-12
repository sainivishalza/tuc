"use client";

import { useState } from "react";
import { Sparkles, ShieldAlert, Boxes, Calculator, Tag, ClipboardCheck } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import type { Dictionary } from "@/lib/i18n";
import ProductMatcher from "./ProductMatcher";
import SupplierRedFlags from "./SupplierRedFlags";
import CbmCalculator from "./CbmCalculator";
import LandedCostCalculator from "./LandedCostCalculator";
import SellingPriceCalculator from "./SellingPriceCalculator";
import ReadinessQuiz from "./ReadinessQuiz";

// Each tab's icon matches the icon that tool already uses on its own
// primary button — the tab and the tool it opens share one visual mark
// instead of the tab bar inventing a second, unrelated icon set.
const TOOLS = [
  { id: "smart-match", icon: Sparkles, labelKey: "smartMatch" as const },
  { id: "supplier-check", icon: ShieldAlert, labelKey: "supplierCheck" as const },
  { id: "cbm", icon: Boxes, labelKey: "cbm" as const },
  { id: "landed-cost", icon: Calculator, labelKey: "landedCost" as const },
  { id: "selling-price", icon: Tag, labelKey: "sellingPrice" as const },
  { id: "readiness", icon: ClipboardCheck, labelKey: "readiness" as const },
];

function renderToolPanel(id: string, dict: Dictionary, onNavigate: (toolId: string) => void) {
  switch (id) {
    case "smart-match":
      return <ProductMatcher dict={dict} />;
    case "supplier-check":
      return <SupplierRedFlags dict={dict} />;
    case "cbm":
      return <CbmCalculator dict={dict} onNavigate={onNavigate} />;
    case "landed-cost":
      return <LandedCostCalculator dict={dict} onNavigate={onNavigate} />;
    case "selling-price":
      return <SellingPriceCalculator dict={dict} />;
    case "readiness":
      return <ReadinessQuiz dict={dict} />;
    default:
      return null;
  }
}

/**
 * Six previously-separate full-height sections (each with its own
 * eyebrow/H2/subtitle) consolidated into one section with a tab bar —
 * stacked one after another they read as six repeats of the same
 * "Question? — subtitle — tool card" shape in a row.
 *
 * All six tools stay mounted at all times; only the active one is
 * shown (via the `hidden` attribute, not conditional rendering). Two
 * of them hand off computed values to the next one in the chain (CBM →
 * Landed Cost → Selling Price) via window events that are set up once
 * on mount — conditionally rendering would tear that listener down
 * every time its tab isn't active.
 */
export default function FreeTools({ dict }: { dict: Dictionary }) {
  const t = dict.tools.freeTools;
  const [active, setActive] = useState(TOOLS[0].id);

  // Used by the CBM → Landed Cost and Landed Cost → Selling Price hand-offs
  // so clicking "Use Weight in Landed Cost Calculator" (etc.) switches to
  // that tool's tab instead of scrolling toward a hidden panel.
  function handleNavigate(toolId: string) {
    setActive(toolId);
    requestAnimationFrame(() => {
      document.getElementById("free-tools")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  return (
    <section id="free-tools" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-10">
          <div
            role="tablist"
            aria-label={t.title}
            className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isActive = active === tool.id;
              return (
                <button
                  key={tool.id}
                  type="button"
                  role="tab"
                  id={`tab-${tool.id}`}
                  aria-selected={isActive}
                  aria-controls={`panel-${tool.id}`}
                  onClick={() => setActive(tool.id)}
                  className={`flex shrink-0 items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "border-accent bg-accent/10 text-accent"
                      : "border-border text-muted hover:border-accent/50"
                  }`}
                >
                  <Icon size={15} />
                  {t.tabs[tool.labelKey]}
                </button>
              );
            })}
          </div>

          <div className="mt-6">
            {TOOLS.map((tool) => (
              <div
                key={tool.id}
                role="tabpanel"
                id={`panel-${tool.id}`}
                aria-labelledby={`tab-${tool.id}`}
                hidden={active !== tool.id}
              >
                {renderToolPanel(tool.id, dict, handleNavigate)}
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
