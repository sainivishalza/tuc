"use client";

import dynamic from "next/dynamic";

const ReadinessQuiz = dynamic(() => import("./ReadinessQuiz"), {
  ssr: false,
  loading: () => null,
});

export default function LazyReadinessQuiz() {
  return <ReadinessQuiz />;
}
