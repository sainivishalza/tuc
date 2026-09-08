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
