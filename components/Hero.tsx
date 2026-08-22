"use client";

import { motion } from "framer-motion";
import { MessageCircle, ArrowRight, ShieldCheck, PackageCheck, Globe2 } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Hero({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative overflow-hidden px-4 pb-20 pt-16 sm:px-6 sm:pt-24">
      <div className="blob -top-24 -left-24 h-80 w-80 bg-brand-red/40" />
      <div className="blob top-10 right-0 h-96 w-96 bg-brand-orange/30" />
      <div className="blob bottom-0 left-1/3 h-72 w-72 bg-brand-gold/30" />

      <div className="relative mx-auto max-w-4xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass mx-auto mb-7 inline-flex items-center gap-2 rounded-full border border-accent-gold/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-widest text-accent-gold sm:text-[13px]"
        >
          <Globe2 size={13} />
          {dict.hero.badge}
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-display text-4xl font-medium leading-[1.1] tracking-tight sm:text-6xl"
        >
          {dict.hero.title}{" "}
          <span className="italic gold-text">{dict.hero.titleHighlight}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-5 max-w-2xl text-balance text-base text-muted sm:text-lg"
        >
          {dict.hero.subtitle}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-orange-900/10 transition hover:opacity-90 sm:w-auto"
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
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="glass mx-auto mt-14 grid max-w-2xl grid-cols-3 divide-x divide-border overflow-hidden rounded-2xl"
        >
          <Stat icon={<PackageCheck size={18} />} value="10" label={dict.hero.stat1Label} />
          <Stat icon={<Globe2 size={18} />} value="3" label={dict.hero.stat2Label} />
          <Stat icon={<ShieldCheck size={18} />} value="< 24h" label={dict.hero.stat3Label} />
        </motion.div>
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
      <span className="text-accent-gold">{icon}</span>
      <span className="font-display text-xl font-semibold sm:text-2xl">{value}</span>
      <span className="text-center text-[11px] text-muted sm:text-xs">{label}</span>
    </div>
  );
}
