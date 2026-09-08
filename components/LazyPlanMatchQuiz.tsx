"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const PlanMatchQuiz = dynamic(() => import("./PlanMatchQuiz"), {
  ssr: false,
  loading: () => null,
});

export default function LazyPlanMatchQuiz({ dict }: { dict: Dictionary }) {
  return <PlanMatchQuiz dict={dict} />;
}
