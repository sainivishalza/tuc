"use client";

import dynamic from "next/dynamic";
import type { Dictionary } from "@/lib/i18n";
import type { Testimonial } from "@/lib/supabase/types";

const Testimonials = dynamic(() => import("./Testimonials"), {
  ssr: false,
  loading: () => null,
});

export default function LazyTestimonials({
  dict,
  testimonials,
}: {
  dict: Dictionary;
  testimonials: Testimonial[];
}) {
  return <Testimonials dict={dict} testimonials={testimonials} />;
}
