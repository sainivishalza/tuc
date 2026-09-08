"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const ProductMatcher = dynamic(() => import("./ProductMatcher"), {
  ssr: false,
  loading: () => null,
});

export default function LazyProductMatcher({ dict }: { dict: Dictionary }) {
  return <ProductMatcher dict={dict} />;
}
