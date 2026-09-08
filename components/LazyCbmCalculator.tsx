"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const CbmCalculator = dynamic(() => import("./CbmCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazyCbmCalculator({ dict }: { dict: Dictionary }) {
  return <CbmCalculator dict={dict} />;
}
