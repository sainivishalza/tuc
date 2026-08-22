import { MessageCircle, ArrowRight, ShieldCheck, PackageCheck, Globe2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Hero({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="blob -top-24 -left-24 h-80 w-80 bg-brand-navy/25" />
      <div className="blob top-10 right-0 h-96 w-96 bg-brand-blue/20" />
      <div className="blob bottom-0 left-1/3 h-72 w-72 bg-accent/15" />

      <div className="relative mx-auto max-w-4xl text-center">
        <div className="glass mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-accent/25 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-accent sm:text-[13px]">
          <Globe2 size={13} />
          {dict.hero.badge}
        </div>

        <h1 className="font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl">
          {dict.hero.title} <span className="brand-gradient-text">{dict.hero.titleHighlight}</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted sm:text-lg">
          {dict.hero.subtitle}
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:opacity-90 sm:w-auto"
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
        </div>

        <div className="glass mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl">
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
    <div className="flex flex-col items-center gap-1 px-3 py-5">
      <span className="text-accent">{icon}</span>
      <span className="font-display text-xl font-semibold sm:text-2xl">{value}</span>
      <span className="text-center text-[11px] text-muted sm:text-xs">{label}</span>
    </div>
  );
}
