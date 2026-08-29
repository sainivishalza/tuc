"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const ContactCTA = dynamic(() => import("./ContactCTA"), {
  ssr: false,
  loading: () => null,
});

export default function LazyContactCTA({ dict }: { dict: Dictionary }) {
  return <ContactCTA dict={dict} />;
}
