"use client";

import { Sparkles, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";

/**
 * No client reviews exist yet — this stays an honest "coming soon" state
 * rather than fabricated testimonials. Replace with real quotes as they
 * come in (name, company, quote) once available.
 */
export default function Testimonials({ dict }: { dict: Dictionary }) {
  return (
    <section className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          badge={dict.testimonials.badge}
          title={dict.testimonials.title}
          subtitle={dict.testimonials.subtitle}
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/35 text-accent">
              <Sparkles size={20} strokeWidth={1.6} />
            </div>
            <h3 className="font-display text-xl font-semibold sm:text-2xl">
              {dict.testimonials.emptyTitle}
            </h3>
            <p className="max-w-md text-sm text-muted sm:text-base">
              {dict.testimonials.emptyDesc}
            </p>
            <a
              href={whatsappLink(dict.contact.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
            >
              <MessageCircle size={16} />
              {dict.nav.chatWhatsapp}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
