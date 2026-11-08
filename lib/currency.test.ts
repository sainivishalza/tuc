import { describe, it, expect } from "vitest";
import { CURRENCIES, DEFAULT_CURRENCY, getCurrency, convertFromUsd, formatCurrency } from "@/lib/currency";

describe("getCurrency", () => {
  it("finds a currency by code", () => {
    expect(getCurrency("EUR").name).toBe("Euro");
  });

  it("falls back to the first (USD) entry for an unknown code", () => {
    expect(getCurrency("XYZ").code).toBe(CURRENCIES[0].code);
    expect(getCurrency("XYZ").code).toBe(DEFAULT_CURRENCY);
  });
});

describe("convertFromUsd", () => {
  it("is an identity conversion for USD", () => {
    expect(convertFromUsd(42, "USD")).toBe(42);
  });

  it("multiplies by the target currency's rate", () => {
    const eurRate = getCurrency("EUR").rate;
    expect(convertFromUsd(100, "EUR")).toBeCloseTo(100 * eurRate);
  });
});

describe("formatCurrency", () => {
  it("prefixes the converted amount with the currency symbol", () => {
    expect(formatCurrency(1, "USD")).toBe("$1.00");
  });

  it("rounds to whole units once the converted amount reaches 100", () => {
    // INR's rate is in the thousands range of USD cents — comfortably over 100 for any non-trivial amount.
    const formatted = formatCurrency(100, "INR");
    expect(formatted).not.toContain(".");
  });

  it("keeps two decimal places under 100 units", () => {
    expect(formatCurrency(0.5, "USD")).toBe("$0.50");
  });

  it("covers every listed currency without throwing", () => {
    for (const c of CURRENCIES) {
      expect(() => formatCurrency(10, c.code)).not.toThrow();
    }
  });
});
