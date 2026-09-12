import Link from "next/link";
import { MessageCircle, ArrowRight, PackageCheck, Globe2, ShieldCheck, Truck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="gradient-hero-dark relative overflow-hidden px-4 pb-16 pt-14 text-white sm:px-6 sm:pt-20">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Left column — kicker, headline, subhead, CTAs. Left-aligned and
            ragged-right, a briefing rather than a centered poster. */}
        <div className="hero-stagger">
          <span className="eyebrow eyebrow-ruled text-sm text-accent">{dict.hero.badge}</span>

          <h1 className="font-display mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
            {dict.hero.title} <span className="text-accent">{dict.hero.titleHighlight}</span>
          </h1>

          <p className="mt-5 max-w-md text-balance text-base leading-relaxed text-white/70 sm:text-lg">
            {dict.hero.subtitle}
          </p>

          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <a
              href={whatsappLink(dict.contact.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold sm:w-auto"
            >
              <MessageCircle size={18} />
              {dict.hero.ctaWhatsapp}
            </a>
            <a
              href="#services"
              className="btn-secondary-inverse flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold sm:w-auto"
            >
              {dict.hero.ctaServices}
              <ArrowRight size={16} />
            </a>
          </div>

          <Link
            href={`/${locale}/track`}
            className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-white/60 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white/60"
          >
            <Truck size={14} />
            {dict.nav.trackShipment}
          </Link>
        </div>

        {/* Right column — a nested ledger panel, one step lighter than the
            hero ground, replacing the old horizontal glass stat-bar with a
            vertical "briefing" list. */}
        <div className="hero-stagger">
          <div className="border border-white/10 bg-brand-blue/60 p-6 sm:p-7">
            <p className="eyebrow text-xs text-white/50">At a glance</p>
            <dl className="mt-4 flex flex-col divide-y divide-white/10">
              <Stat icon={<PackageCheck size={18} />} value="10" label={dict.hero.stat1Label} />
              <Stat icon={<Globe2 size={18} />} value="3" label={dict.hero.stat2Label} />
              <Stat icon={<ShieldCheck size={18} />} value="< 24h" label={dict.hero.stat3Label} />
            </dl>
          </div>
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
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-3">
        <span className="text-accent">{icon}</span>
        <dt className="text-sm text-white/70">{label}</dt>
      </div>
      <dd className="font-display text-2xl font-bold tracking-tight text-white">{value}</dd>
    </div>
  );
}
