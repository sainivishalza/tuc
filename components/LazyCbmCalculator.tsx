"use client";

import dynamic from "next/dynamic";

const CbmCalculator = dynamic(() => import("./CbmCalculator"), {
  ssr: false,
  loading: () => null,
});

export default function LazyCbmCalculator() {
  return <CbmCalculator />;
}
