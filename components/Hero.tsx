import Link from "next/link";
import { MessageCircle, ArrowRight, PackageCheck, Globe2, ShieldCheck, Truck } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { AnimatedNumber } from "./AnimatedStats";

export default function Hero({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  return (
    <section className="gradient-hero-dark relative overflow-hidden px-4 pb-16 pt-14 text-white sm:px-6 sm:pt-20">
      <div className="relative mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16">
        {/* Left column — kicker, headline, subhead, CTAs. Left-aligned and
            ragged-right, a briefing rather than a centered poster. */}
        <div className="hero-stagger">
          <span className="eyebrow eyebrow-ruled text-sm text-accent">{dict.hero.badge}</span>

          <h1 className="hero-title font-display mt-5 max-w-xl text-4xl font-bold leading-[1.08] tracking-tight sm:text-5xl lg:text-[3.4rem]">
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
              className="btn-primary w-full sm:w-auto"
            >
              <MessageCircle size={18} />
              {dict.hero.ctaWhatsapp}
            </a>
            <a
              href="#services"
              className="btn-secondary-inverse w-full sm:w-auto"
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
            vertical "briefing" list. A dashed route line + two port nodes
            sit behind the panel, drawn from empty margin so it never
            crosses body text in any locale — the one on-subject graphic
            in a hero that was otherwise pure typography. */}
        <div className="relative hero-stagger">
          <svg
            aria-hidden
            viewBox="0 0 400 460"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -inset-x-6 -inset-y-10 hidden overflow-visible lg:block"
          >
            <path
              d="M -10 430 C 90 380, 140 300, 200 230 S 320 90, 410 40"
              fill="none"
              stroke="color-mix(in srgb, var(--accent) 45%, transparent)"
              strokeWidth="1.5"
              strokeDasharray="5 7"
              strokeLinecap="round"
            />
            <circle cx="-10" cy="430" r="4.5" fill="var(--accent)" />
            <circle cx="410" cy="40" r="4.5" fill="var(--accent)" />
          </svg>

          <div className="relative border border-white/10 bg-brand-blue/60 p-6 sm:p-7">
            <p className="eyebrow text-xs text-white/50">At a glance</p>
            <dl className="mt-4 flex flex-col divide-y divide-white/10">
              <Stat icon={<PackageCheck size={18} />} label={dict.hero.stat1Label}>
                <AnimatedNumber target={10} className="kpi-value text-white" />
              </Stat>
              <Stat icon={<Globe2 size={18} />} label={dict.hero.stat2Label}>
                <AnimatedNumber target={3} className="kpi-value text-white" />
              </Stat>
              <Stat icon={<ShieldCheck size={18} />} label={dict.hero.stat3Label}>
                <span className="kpi-value text-white">&lt; 24h</span>
              </Stat>
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({
  icon,
  children,
  label,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
      <div className="flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <dt className="kpi-label text-white/70">{label}</dt>
      </div>
      <dd>{children}</dd>
    </div>
  );
}
