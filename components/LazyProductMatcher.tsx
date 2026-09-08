"use client";

import dynamic from "next/dynamic";

const ProductMatcher = dynamic(() => import("./ProductMatcher"), {
  ssr: false,
  loading: () => null,
});

export default function LazyProductMatcher() {
  return <ProductMatcher />;
}
