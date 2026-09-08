"use client";

import dynamic from "next/dynamic";
import type { Locale } from "@/lib/i18n";

const PaymentSchedulePlanner = dynamic(() => import("./PaymentSchedulePlanner"), {
  ssr: false,
  loading: () => null,
});

// ssr: false for the same reason as LazyOrderTimingPlanner — the default
// order date is seeded from `new Date()`, which would otherwise risk a
// server/client hydration mismatch around a day boundary.
export default function LazyPaymentSchedulePlanner({ locale }: { locale: Locale }) {
  return <PaymentSchedulePlanner locale={locale} />;
}
