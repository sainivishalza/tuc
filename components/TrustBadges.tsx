"use client";

import { Shield, CheckCircle, Truck, Lock, Award, Headphones } from "lucide-react";
import Reveal from "./Reveal";
import type { Dictionary } from "@/lib/i18n";

// Flat ink icons throughout, with gold reserved as the one deliberate
// break from the ink/amber system — an award is gold, not a decorative
// color choice.
const badgeMeta = [
  { icon: Shield, color: "text-foreground" },
  { icon: Lock, color: "text-foreground" },
  { icon: CheckCircle, color: "text-foreground" },
  { icon: Truck, color: "text-foreground" },
  { icon: Award, color: "text-[#b08d4f]" },
  { icon: Headphones, color: "text-foreground" },
];

export default function TrustBadges({ dict }: { dict: Dictionary }) {
  const badges = badgeMeta.map((meta, i) => ({
    ...meta,
    title: dict.trustBadges.items[i].title,
    desc: dict.trustBadges.items[i].desc,
  }));

  return (
    <section className="section-tint-blue relative px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} delay={i * 0.05}>
                <div className="glass-strong group flex flex-col items-center gap-2 p-4 text-center">
                  <div className="flex h-11 w-11 items-center justify-center border border-border transition-colors duration-300 group-hover:border-accent">
                    <Icon size={20} strokeWidth={1.6} className={badge.color} />
                  </div>
                  <h3 className="text-xs font-semibold sm:text-sm">{badge.title}</h3>
                  <p className="text-[11px] text-muted">{badge.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
