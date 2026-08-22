import {
  Factory,
  Truck,
  Package,
  ClipboardCheck,
  ShieldCheck,
  Lock,
  SearchCheck,
  MessageSquareText,
  Handshake,
  PackageCheck,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import TiltCard from "./TiltCard";

const icons = [
  Factory,
  Truck,
  Package,
  ClipboardCheck,
  ShieldCheck,
  Lock,
  SearchCheck,
  MessageSquareText,
  Handshake,
  PackageCheck,
];

export default function Services({ dict }: { dict: Dictionary }) {
  return (
    <section id="services" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          badge={dict.services.badge}
          title={dict.services.title}
          subtitle={dict.services.subtitle}
        />

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {dict.services.items.map((item, i) => {
            const Icon = icons[i % icons.length];
            return (
              <Reveal key={item.title} delay={(i % 3) * 0.08}>
                <TiltCard className="glass-strong group flex h-full flex-col gap-4 rounded-2xl p-6 transition hover:shadow-xl">
                  <div className="brand-gradient flex h-11 w-11 items-center justify-center rounded-xl text-white shadow-sm transition group-hover:scale-105">
                    <Icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-display text-base font-bold">{item.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.desc}</p>
                  </div>
                </TiltCard>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  badge,
  title,
  subtitle,
}: {
  badge: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <span className="brand-gradient-text text-xs font-bold uppercase tracking-wider sm:text-sm">
        {badge}
      </span>
      <h2 className="font-display mt-2 text-2xl font-extrabold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle && <p className="mt-3 text-sm text-muted sm:text-base">{subtitle}</p>}
    </Reveal>
  );
}
