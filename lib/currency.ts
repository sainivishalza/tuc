export interface CurrencyOption {
  code: string;
  symbol: string;
  name: string;
  /** Units of this currency per 1 USD. Static and approximate — this
   * site quotes and invoices in USD; the conversion is a reference
   * estimate for browsing only, not a live rate for payment. Update
   * periodically if it drifts noticeably from real rates. */
  rate: number;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: "USD", symbol: "$", name: "US Dollar", rate: 1 },
  { code: "EUR", symbol: "€", name: "Euro", rate: 0.92 },
  { code: "GBP", symbol: "£", name: "British Pound", rate: 0.79 },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan", rate: 7.1 },
  { code: "INR", symbol: "₹", name: "Indian Rupee", rate: 84 },
  { code: "RUB", symbol: "₽", name: "Russian Ruble", rate: 97 },
  { code: "AED", symbol: "AED ", name: "UAE Dirham", rate: 3.67 },
];

export const DEFAULT_CURRENCY = "USD";

export function getCurrency(code: string): CurrencyOption {
  return CURRENCIES.find((c) => c.code === code) ?? CURRENCIES[0];
}

export function convertFromUsd(amountUsd: number, code: string): number {
  return amountUsd * getCurrency(code).rate;
}

/** Whole-dollar-style rounding for the converted figure — this is a
 * browsing estimate, not an invoice, so cents of precision on a
 * converted currency would be false confidence. */
export function formatCurrency(amountUsd: number, code: string): string {
  const currency = getCurrency(code);
  const converted = convertFromUsd(amountUsd, code);
  const decimals = converted >= 100 ? 0 : 2;
  return `${currency.symbol}${converted.toFixed(decimals)}`;
}
