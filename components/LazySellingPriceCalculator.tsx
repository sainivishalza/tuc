"use client";

import dynamic from "next/dynamic";

const SellingPriceCalculator = dynamic(() => import("./SellingPriceCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazySellingPriceCalculator() {
  return <SellingPriceCalculator />;
}
