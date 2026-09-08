// Free, rule-based landed-cost estimator — no external API, no cost.
// Uses static illustrative duty/tax/freight rate tables to give a
// planning-stage ballpark, the same way a sourcing agent would sketch
// numbers on a first call before a customs broker confirms the exact
// HS-code-based figures.

export interface Destination {
  id: string;
  label: string;
  taxLabel: string;
  taxRate: number;
  taxNote: string;
}

export const DESTINATIONS: Destination[] = [
  { id: "us", label: "United States", taxLabel: "Sales tax", taxRate: 0, taxNote: "No federal import VAT — state sales tax varies and isn't included here." },
  { id: "uk", label: "United Kingdom", taxLabel: "Import VAT", taxRate: 20, taxNote: "Standard UK import VAT rate." },
  { id: "eu", label: "European Union", taxLabel: "Import VAT", taxRate: 21, taxNote: "EU average — the exact rate depends on the destination country." },
  { id: "canada", label: "Canada", taxLabel: "GST", taxRate: 5, taxNote: "Federal GST only — provincial sales tax may add more." },
  { id: "australia", label: "Australia", taxLabel: "GST", taxRate: 10, taxNote: "Standard Australian import GST rate." },
  { id: "other", label: "Other / Not sure yet", taxLabel: "Import tax", taxRate: 0, taxNote: "Varies by country — we'll confirm the exact rate with your quote." },
];

type Rate = { low: number; high: number };

const DUTY_RATES: Record<string, Record<string, Rate>> = {
  electronics: { us: { low: 0, high: 5 }, uk: { low: 0, high: 4 }, eu: { low: 0, high: 4 }, canada: { low: 0, high: 5 }, australia: { low: 0, high: 5 }, other: { low: 0, high: 10 } },
  home: { us: { low: 0, high: 5 }, uk: { low: 2, high: 6 }, eu: { low: 2, high: 6 }, canada: { low: 5, high: 8 }, australia: { low: 0, high: 5 }, other: { low: 0, high: 10 } },
  fashion: { us: { low: 10, high: 18 }, uk: { low: 8, high: 12 }, eu: { low: 8, high: 12 }, canada: { low: 16, high: 18 }, australia: { low: 0, high: 5 }, other: { low: 5, high: 20 } },
  building: { us: { low: 0, high: 5 }, uk: { low: 0, high: 5 }, eu: { low: 0, high: 5 }, canada: { low: 0, high: 6 }, australia: { low: 0, high: 5 }, other: { low: 0, high: 10 } },
  packaging: { us: { low: 0, high: 3 }, uk: { low: 0, high: 4 }, eu: { low: 0, high: 4 }, canada: { low: 0, high: 5 }, australia: { low: 0, high: 5 }, other: { low: 0, high: 8 } },
  auto: { us: { low: 0, high: 5 }, uk: { low: 2, high: 4 }, eu: { low: 2, high: 4 }, canada: { low: 0, high: 6 }, australia: { low: 5, high: 5 }, other: { low: 0, high: 10 } },
  other: { us: { low: 0, high: 10 }, uk: { low: 0, high: 10 }, eu: { low: 0, high: 10 }, canada: { low: 0, high: 10 }, australia: { low: 0, high: 10 }, other: { low: 0, high: 15 } },
};

export const SHIPPING_METHODS: { id: string; label: string; rate: Rate }[] = [
  { id: "sea", label: "Sea freight (consolidated)", rate: { low: 2.5, high: 4.5 } },
  { id: "air", label: "Air freight", rate: { low: 5.5, high: 8.5 } },
  { id: "express", label: "Express courier", rate: { low: 8, high: 13 } },
];

export interface LandedCostInput {
  categoryId: string;
  destinationId: string;
  quantity: number;
  unitPrice: number;
  weightKg: number | null;
  methodId: string;
}

export interface LandedCostResult {
  productValue: number;
  duty: Rate;
  freight: Rate | null;
  tax: Rate;
  total: Rate;
  destination: Destination;
  dutyRate: Rate;
}

export function calculateLandedCost(input: LandedCostInput): LandedCostResult {
  const destination = DESTINATIONS.find((d) => d.id === input.destinationId) ?? DESTINATIONS[DESTINATIONS.length - 1];
  const dutyRate = DUTY_RATES[input.categoryId]?.[destination.id] ?? DUTY_RATES.other[destination.id];
  const method = SHIPPING_METHODS.find((m) => m.id === input.methodId) ?? SHIPPING_METHODS[0];

  const productValue = input.quantity * input.unitPrice;
  const duty: Rate = {
    low: (productValue * dutyRate.low) / 100,
    high: (productValue * dutyRate.high) / 100,
  };

  const freight: Rate | null =
    input.weightKg && input.weightKg > 0
      ? { low: input.weightKg * method.rate.low, high: input.weightKg * method.rate.high }
      : null;

  const taxableLow = productValue + duty.low + (freight?.low ?? 0);
  const taxableHigh = productValue + duty.high + (freight?.high ?? 0);
  const tax: Rate = {
    low: (taxableLow * destination.taxRate) / 100,
    high: (taxableHigh * destination.taxRate) / 100,
  };

  const total: Rate = {
    low: productValue + duty.low + (freight?.low ?? 0) + tax.low,
    high: productValue + duty.high + (freight?.high ?? 0) + tax.high,
  };

  return { productValue, duty, freight, tax, total, destination, dutyRate };
}
