"use client";

import { MessageCircle, Phone } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { whatsappLink, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";

export default function ContactCTA({ dict }: { dict: Dictionary }) {
  const pathname = usePathname() ?? "/";
  return (
    <section id="contact" className="relative px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-brand-navy text-white">
        <div className="blob -top-20 left-1/3 h-72 w-72 bg-brand-blue/30" />
        <div className="brand-gradient absolute inset-x-0 top-0 h-1" />
        <Reveal className="relative flex flex-col items-center gap-4 px-6 py-16 text-center sm:py-20">
          <span className="eyebrow text-xs text-accent sm:text-sm">{dict.contact.badge}</span>
          <h2 className="font-display max-w-xl text-3xl font-medium tracking-tight sm:text-5xl">
            {dict.contact.title}
          </h2>
          <p className="max-w-md text-sm text-white/70 sm:text-base">{dict.contact.subtitle}</p>

          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackCtaClick("Contact CTA", pathname)}
            className="mt-3 flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-brand-navy shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
          >
            <MessageCircle size={18} />
            {dict.contact.whatsappCta}
          </a>

          <div className="mt-2 flex items-center gap-2 text-xs text-white/60 sm:text-sm">
            <Phone size={14} />
            {dict.contact.whatsappNumberLabel} {WHATSAPP_DISPLAY}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
