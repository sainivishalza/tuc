"use client";

import { Shield, CheckCircle, Truck, Lock, Award, Headphones } from "lucide-react";
import Reveal from "./Reveal";
import type { Dictionary } from "@/lib/i18n";

const badgeMeta = [
  { icon: Shield, color: "text-blue-400", bg: "from-blue-500/15 to-blue-600/5" },
  { icon: Lock, color: "text-emerald-400", bg: "from-emerald-500/15 to-emerald-600/5" },
  { icon: CheckCircle, color: "text-amber-400", bg: "from-amber-500/15 to-amber-600/5" },
  { icon: Truck, color: "text-purple-400", bg: "from-purple-500/15 to-purple-600/5" },
  { icon: Award, color: "text-pink-400", bg: "from-pink-500/15 to-pink-600/5" },
  { icon: Headphones, color: "text-cyan-400", bg: "from-cyan-500/15 to-cyan-600/5" },
];

export default function TrustBadges({ dict }: { dict: Dictionary }) {
  const badges = badgeMeta.map((meta, i) => ({
    ...meta,
    title: dict.trustBadges.items[i].title,
    desc: dict.trustBadges.items[i].desc,
  }));

  return (
    <section className="relative px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {badges.map((badge, i) => {
            const Icon = badge.icon;
            return (
              <Reveal key={badge.title} delay={i * 0.05}>
                <div className="glass-strong group flex flex-col items-center gap-2 rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1">
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${badge.bg} transition-transform duration-300 group-hover:scale-110`}
                  >
                    <Icon size={22} className={badge.color} />
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
