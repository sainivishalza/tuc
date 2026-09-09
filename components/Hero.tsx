import Link from "next/link";
import { MessageCircle, ArrowRight, ShieldCheck, PackageCheck, Globe2, Truck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="gradient-hero-light relative overflow-hidden px-4 pb-16 pt-16 sm:px-6 sm:pt-20">
      <div className="blob -top-24 -left-24 h-80 w-80 bg-brand-blue/15" />
      <div className="blob bottom-0 left-1/4 h-72 w-72 bg-accent/15" />

      <div className="relative mx-auto max-w-3xl text-center">
        <div className="glass mx-auto inline-flex items-center gap-2 rounded-full border border-accent/25 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent sm:text-[13px]">
          <Globe2 size={13} />
          {dict.hero.badge}
        </div>

        <h1 className="font-display mt-6 text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
          {dict.hero.title} <span className="brand-gradient-text">{dict.hero.titleHighlight}</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-balance text-base text-muted sm:text-lg">
          {dict.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient-animated flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/25 transition hover:scale-105 sm:w-auto"
          >
            <MessageCircle size={18} />
            {dict.hero.ctaWhatsapp}
          </a>
          <a
            href="#services"
            className="glass-strong flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-80 sm:w-auto"
          >
            {dict.hero.ctaServices}
            <ArrowRight size={16} />
          </a>
          <Link
            href={`/${locale}/track`}
            className="glass-strong flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-80 sm:w-auto"
          >
            <Truck size={16} />
            {dict.nav.trackShipment}
          </Link>
        </div>

        <div className="glass stat-bar mx-auto mt-12 grid max-w-lg grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl">
          <Stat icon={<PackageCheck size={18} />} value="10" label={dict.hero.stat1Label} />
          <Stat icon={<Globe2 size={18} />} value="3" label={dict.hero.stat2Label} />
          <Stat icon={<ShieldCheck size={18} />} value="< 24h" label={dict.hero.stat3Label} />
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-1.5 px-3 py-6">
      <span className="text-accent">{icon}</span>
      <span className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
        {value}
      </span>
      <span className="text-center text-[11px] font-medium text-muted sm:text-xs">
        {label}
      </span>
    </div>
  );
}
