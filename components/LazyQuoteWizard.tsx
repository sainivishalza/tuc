"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const QuoteWizard = dynamic(() => import("./QuoteWizard"), {
  ssr: false,
  loading: () => null,
});

export default function LazyQuoteWizard({ dict }: { dict: Dictionary }) {
  return <QuoteWizard dict={dict} />;
}
