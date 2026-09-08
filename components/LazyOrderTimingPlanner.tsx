"use client";

import dynamic from "next/dynamic";
import type { Dictionary, Locale } from "@/lib/i18n";

const OrderTimingPlanner = dynamic(() => import("./OrderTimingPlanner"), {
  ssr: false,
  loading: () => null,
});

// ssr: false here isn't just a performance choice like the other Lazy*
// wrappers — OrderTimingPlanner seeds its date input from `new Date()`,
// which would otherwise run once on the server at build/render time and
// again on the client at hydration, risking a hydration mismatch if a
// day boundary (or timezone) falls between the two.
export default function LazyOrderTimingPlanner({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return <OrderTimingPlanner dict={dict} locale={locale} />;
}
