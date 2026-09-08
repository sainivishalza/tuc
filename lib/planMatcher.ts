// Free plan-matching quiz — no external API. Maps three quick questions to
// the pricing tier that actually fits, instead of leaving a first-time
// visitor to guess between three commission percentages on their own.
// Index matches dict.pricing.plans: 0 Starter, 1 Professional, 2 Enterprise.

export type SupplierAnswer = "have_supplier" | "need_sourcing";
export type CustomAnswer = "no" | "yes";
export type ScaleAnswer = "one" | "multiple_ongoing";

export type PlanIndex = 0 | 1 | 2;

export function matchPlan(supplier: SupplierAnswer, custom: CustomAnswer, scale: ScaleAnswer): PlanIndex {
  if (scale === "multiple_ongoing") return 2;
  if (supplier === "have_supplier" && custom === "no") return 0;
  return 1;
}

export const PLAN_REASONS: Record<PlanIndex, string> = {
  0: "You already have a supplier — you mainly need verification, secure payment, inspection, and shipping handled.",
  1: "You need sourcing help — finding a factory, custom branding, or product development — for a single product line.",
  2: "Multiple suppliers or product lines running at once is exactly what the dedicated team and multi-supplier coordination in this tier are built for.",
};
