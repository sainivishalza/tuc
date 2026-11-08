"use client";

import { formatCurrency } from "@/lib/currency";
import { useCurrency } from "@/lib/useCurrency";

/** The site always quotes and invoices in USD — this renders that USD
 * figure as the primary value and, when the visitor has picked another
 * display currency, a muted approximate conversion beside it. Never the
 * other way around: the converted figure is for browsing only. */
export default function PriceTag({
  amountUsd,
  prefix,
  suffix,
  className,
}: {
  amountUsd: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const { currency } = useCurrency();

  return (
    <span className={className}>
      {prefix ? `${prefix} ` : ""}${amountUsd}
      {suffix ? ` ${suffix}` : ""}
      {currency !== "USD" && <span className="ml-1 font-normal text-muted">(≈ {formatCurrency(amountUsd, currency)})</span>}
    </span>
  );
}
