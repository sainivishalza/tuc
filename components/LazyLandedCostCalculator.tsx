"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const LandedCostCalculator = dynamic(() => import("./LandedCostCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazyLandedCostCalculator({ dict }: { dict: Dictionary }) {
  return <LandedCostCalculator dict={dict} />;
}
