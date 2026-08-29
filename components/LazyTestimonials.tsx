"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";

const Testimonials = dynamic(() => import("./Testimonials"), {
  ssr: false,
  loading: () => null,
});

export default function LazyTestimonials({ dict }: { dict: Dictionary }) {
  return <Testimonials dict={dict} />;
}
