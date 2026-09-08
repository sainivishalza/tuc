// Free, rule-based landed-cost estimator — no external API, no cost.
// Uses static illustrative duty/tax/freight rate tables to give a
// planning-stage ballpark, the same way a sourcing agent would sketch
// numbers on a first call before a customs broker confirms the exact
// HS-code-based figures.

export interface DestinationContent {
  label: string;
  taxLabel: string;
  taxNote: string;
}

export interface Destination extends DestinationContent {
  id: string;
  taxRate: number;
}

const DESTINATION_TAX_RATES: Record<string, number> = {
  us: 0,
  uk: 20,
  eu: 21,
  canada: 5,
  australia: 10,
  other: 0,
};

export const DESTINATION_IDS = ["us", "uk", "eu", "canada", "australia", "other"];

export function getDestinations(content: Record<string, DestinationContent>): Destination[] {
  return DESTINATION_IDS.map((id) => ({ id, taxRate: DESTINATION_TAX_RATES[id], ...content[id] }));
}

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

const SHIPPING_METHOD_RATES: Record<string, Rate> = {
  sea: { low: 2.5, high: 4.5 },
  air: { low: 5.5, high: 8.5 },
  express: { low: 8, high: 13 },
};

export const SHIPPING_METHOD_IDS = ["sea", "air", "express"];

export function getShippingMethods(content: Record<string, string>): { id: string; label: string; rate: Rate }[] {
  return SHIPPING_METHOD_IDS.map((id) => ({ id, label: content[id], rate: SHIPPING_METHOD_RATES[id] }));
}

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

export function calculateLandedCost(
  input: LandedCostInput,
  destinations: Destination[],
  shippingMethods: { id: string; label: string; rate: Rate }[]
): LandedCostResult {
  const destination = destinations.find((d) => d.id === input.destinationId) ?? destinations[destinations.length - 1];
  const dutyRate = DUTY_RATES[input.categoryId]?.[destination.id] ?? DUTY_RATES.other[destination.id];
  const method = shippingMethods.find((m) => m.id === input.methodId) ?? shippingMethods[0];

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
