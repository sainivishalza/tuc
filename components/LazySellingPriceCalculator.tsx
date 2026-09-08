"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const SellingPriceCalculator = dynamic(() => import("./SellingPriceCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazySellingPriceCalculator({ dict }: { dict: Dictionary }) {
  return <SellingPriceCalculator dict={dict} />;
}
