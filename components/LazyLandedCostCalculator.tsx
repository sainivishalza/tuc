"use client";

import dynamic from "next/dynamic";

const LandedCostCalculator = dynamic(() => import("./LandedCostCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazyLandedCostCalculator() {
  return <LandedCostCalculator />;
}
