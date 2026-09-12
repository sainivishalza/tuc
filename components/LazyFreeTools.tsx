"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const FreeTools = dynamic(() => import("./FreeTools"), {
  ssr: false,
  loading: () => null,
});

export default function LazyFreeTools({ dict }: { dict: Dictionary }) {
  return <FreeTools dict={dict} />;
}
