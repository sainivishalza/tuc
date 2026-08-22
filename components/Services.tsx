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
            const isLastOrphan = i === dict.services.items.length - 1 && i % 3 === 0;
            return (
              <Reveal
                key={item.title}
                delay={(i % 3) * 0.08}
                className={isLastOrphan ? "lg:col-start-2" : undefined}
              >
                <TiltCard className="glass-strong group flex h-full flex-col gap-5 rounded-2xl border p-7 transition hover:shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full border border-accent/35 text-accent transition group-hover:border-accent group-hover:bg-accent/10">
                      <Icon size={19} strokeWidth={1.6} />
                    </div>
                    <span className="section-number text-2xl">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-display text-lg font-semibold">{item.title}</h3>
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
      <span className="eyebrow accent-text text-xs sm:text-sm">{badge}</span>
      <h2 className="font-display mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
        {title}
      </h2>
      <div className="brand-gradient mx-auto mt-4 h-1 w-14 rounded-full" />
      {subtitle && <p className="mt-5 text-sm text-muted sm:text-base">{subtitle}</p>}
    </Reveal>
  );
}
