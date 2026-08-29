"use client";

import {
  Cpu,
  Home,
  Shirt,
  Building2,
  Package,
  Wrench,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";

const icons = [Cpu, Home, Shirt, Building2, Package, Wrench];

const colors = [
  "from-blue-500/15 to-blue-600/5",
  "from-amber-500/15 to-amber-600/5",
  "from-pink-500/15 to-pink-600/5",
  "from-emerald-500/15 to-emerald-600/5",
  "from-purple-500/15 to-purple-600/5",
  "from-red-500/15 to-red-600/5",
];

const iconColors = [
  "text-blue-400",
  "text-amber-400",
  "text-pink-400",
  "text-emerald-400",
  "text-purple-400",
  "text-red-400",
];

export default function ProductCategories({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          badge={dict.categories.badge}
          title={dict.categories.title}
          subtitle={dict.categories.subtitle}
        />

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {dict.categories.items.map((cat, i) => {
            const Icon = icons[i % icons.length];
            const bg = colors[i % colors.length];
            const iconColor = iconColors[i % iconColors.length];

            return (
              <Reveal key={cat.name} delay={i * 0.06}>
                <div
                  className={`glass-strong group flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}
                >
                  <div
                    className={`flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${bg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={24} className={iconColor} />
                  </div>
                  <h3 className="font-display text-sm font-semibold sm:text-base">
                    {cat.name}
                  </h3>
                  <p className="text-xs text-muted sm:text-sm">{cat.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
