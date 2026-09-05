"use client";

import { Sparkles, MessageCircle, Quote, Star } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Testimonial } from "@/lib/supabase/types";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < rating
              ? "fill-accent text-accent"
              : "text-muted/30"
          }
        />
      ))}
    </div>
  );
}

function AvatarInitials({ name }: { name: string }) {
  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-sm font-bold text-accent">
      {initials}
    </div>
  );
}

export default function Testimonials({
  dict,
  testimonials,
}: {
  dict: Dictionary;
  testimonials: Testimonial[];
}) {
  return (
    <section className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          badge={dict.testimonials.badge}
          title={dict.testimonials.title}
          subtitle={dict.testimonials.subtitle}
        />

        {testimonials.length > 0 ? (
          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <div className="glass-strong flex h-full flex-col gap-3 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-accent/5">
                  <div className="flex items-start justify-between">
                    <Quote size={18} className="shrink-0 text-accent/30" />
                    <StarRating rating={t.rating} />
                  </div>
                  <p className="text-sm leading-relaxed text-muted sm:text-base">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-2">
                    <AvatarInitials name={t.name} />
                    <div>
                      <p className="font-display text-sm font-semibold">
                        {t.name}
                      </p>
                      <p className="text-xs text-muted">{t.company}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        ) : (
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
        )}
      </div>
    </section>
  );
}
