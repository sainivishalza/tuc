// Free selling-price calculator — no external API. Works backward from a
// target profit margin (as a % of revenue, the standard e-commerce
// definition — not markup over cost) to the price a buyer needs to charge,
// after accounting for marketplace/platform fees and per-unit fulfillment
// cost.

export interface SellingPriceInput {
  landedCostPerUnit: number;
  fulfillmentCostPerUnit: number;
  marginPct: number;
  feePct: number;
  quantity: number;
}

export interface SellingPriceResult {
  sellingPrice: number;
  profitPerUnit: number;
  feeAmountPerUnit: number;
  markupPct: number;
  totalProfit: number;
}

/** Null when marginPct + feePct leaves no room to price into (>= 100% of revenue already spoken for). */
export function calculateSellingPrice(input: SellingPriceInput): SellingPriceResult | null {
  const costBase = input.landedCostPerUnit + input.fulfillmentCostPerUnit;
  const denominator = 1 - input.marginPct / 100 - input.feePct / 100;
  if (denominator <= 0) return null;

  const sellingPrice = costBase / denominator;
  const feeAmountPerUnit = sellingPrice * (input.feePct / 100);
  const profitPerUnit = sellingPrice - costBase - feeAmountPerUnit;
  const markupPct = costBase > 0 ? (profitPerUnit / costBase) * 100 : 0;
  const totalProfit = profitPerUnit * input.quantity;

  return { sellingPrice, profitPerUnit, feeAmountPerUnit, markupPct, totalProfit };
}
