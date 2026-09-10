"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const Services = dynamic(() => import("./Services"), {
  ssr: false,
  loading: () => null,
});

export default function LazyServices({ dict }: { dict: Dictionary }) {
  return <Services dict={dict} />;
}
