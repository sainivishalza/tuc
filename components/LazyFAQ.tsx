"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const FAQ = dynamic(() => import("./FAQ"), { ssr: false, loading: () => null });

export default function LazyFAQ({ dict }: { dict: Dictionary }) {
  return <FAQ dict={dict} />;
}
