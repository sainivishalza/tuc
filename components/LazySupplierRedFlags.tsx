"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const SupplierRedFlags = dynamic(() => import("./SupplierRedFlags"), {
  ssr: false,
  loading: () => null,
});

export default function LazySupplierRedFlags({ dict }: { dict: Dictionary }) {
  return <SupplierRedFlags dict={dict} />;
}
