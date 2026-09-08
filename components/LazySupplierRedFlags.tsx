"use client";

import dynamic from "next/dynamic";

const SupplierRedFlags = dynamic(() => import("./SupplierRedFlags"), {
  ssr: false,
  loading: () => null,
});

export default function LazySupplierRedFlags() {
  return <SupplierRedFlags />;
}
