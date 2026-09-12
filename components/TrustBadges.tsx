"use client";

import { Shield, CheckCircle, Truck, Lock, Award, Headphones } from "lucide-react";
import Reveal from "./Reveal";
import ServiceIllustration from "./ServiceIllustration";
import type { Dictionary } from "@/lib/i18n";

// Same solid-navy/white-icon tile as Services, Why Us, and Stats — one
// icon treatment across the whole page instead of this section's own
// separate outline style (with a one-off gold "Award" icon).
const icons = [Shield, Lock, CheckCircle, Truck, Award, Headphones];

export default function TrustBadges({ dict }: { dict: Dictionary }) {
  const badges = icons.map((icon, i) => ({
    icon,
    title: dict.trustBadges.items[i].title,
    desc: dict.trustBadges.items[i].desc,
  }));

  return (
    <section className="section-tint-blue relative px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-6">
          {badges.map((badge, i) => (
            <Reveal key={badge.title} delay={i * 0.05}>
              <div className="glass-strong group flex flex-col items-center gap-2 p-4 text-center">
                <ServiceIllustration icon={badge.icon} size={44} />
                <h3 className="text-xs font-semibold sm:text-sm">{badge.title}</h3>
                <p className="text-[11px] text-muted">{badge.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
