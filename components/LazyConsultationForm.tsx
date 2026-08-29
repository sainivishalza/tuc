"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const ConsultationForm = dynamic(() => import("./ConsultationForm"), {
  ssr: false,
  loading: () => null,
});

export default function LazyConsultationForm({ dict }: { dict: Dictionary }) {
  return <ConsultationForm dict={dict} />;
}
