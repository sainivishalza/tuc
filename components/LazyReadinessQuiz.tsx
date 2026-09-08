"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const ReadinessQuiz = dynamic(() => import("./ReadinessQuiz"), {
  ssr: false,
  loading: () => null,
});

export default function LazyReadinessQuiz({ dict }: { dict: Dictionary }) {
  return <ReadinessQuiz dict={dict} />;
}
