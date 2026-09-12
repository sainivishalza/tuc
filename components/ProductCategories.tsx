"use client";

import Link from "next/link";
import {
  Cpu,
  Home,
  Shirt,
  Building2,
  Package,
  Wrench,
} from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";

const icons = [Cpu, Home, Shirt, Building2, Package, Wrench];

// Same order as dict.categories.items in every locale — pairs each card
// with its /sourcing/[slug] landing page slug.
const slugs = [
  "electronics-gadgets",
  "home-kitchen",
  "fashion-textiles",
  "building-materials",
  "packaging-printing",
  "auto-parts-tools",
];

export default function ProductCategories({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  return (
    <section className="section-tint-amber relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          badge={dict.categories.badge}
          title={dict.categories.title}
          subtitle={dict.categories.subtitle}
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {dict.categories.items.map((cat, i) => {
            const Icon = icons[i % icons.length];

            return (
              <Reveal key={cat.name} delay={i * 0.06}>
                <Link
                  href={`/${locale}/sourcing/${slugs[i % slugs.length]}`}
                  className={`glass-strong group flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-brand-navy/20 bg-surface transition-transform duration-300 group-hover:scale-110">
                    <Icon size={24} strokeWidth={1.6} className="text-brand-navy" />
                  </div>
                  <h3 className="font-display text-sm font-semibold sm:text-base">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted sm:text-sm">{cat.desc}</p>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
