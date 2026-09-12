"use client";

import { Sparkles, MessageCircle, Star } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import type { Testimonial } from "@/lib/supabase/types";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";
import { countryFlagEmoji } from "@/lib/countries";

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

// A real company logo replaces the initials circle once staff upload
// one for that client — falls back to initials otherwise, never a
// placeholder or blank spot.
function ClientAvatar({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-white">
        <img src={logoUrl} alt="" className="h-full w-full object-contain p-1" />
      </span>
    );
  }
  return <AvatarInitials name={name} />;
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
                <div className="glass-strong card card-no-rule relative flex h-full flex-col gap-1 overflow-hidden">
                  <span
                    aria-hidden
                    className="font-display pointer-events-none absolute -top-3 left-4 select-none text-7xl leading-none text-foreground/15"
                  >
                    &ldquo;
                  </span>
                  <div className="flex items-start justify-end">
                    <StarRating rating={t.rating} />
                  </div>
                  <p className="font-display relative text-base leading-relaxed text-foreground sm:text-lg">
                    {t.quote}
                  </p>
                  <div className="mt-auto flex items-center gap-3 pt-4">
                    <ClientAvatar name={t.name} logoUrl={t.logo_url} />
                    <div>
                      <p className="font-display text-sm font-semibold">
                        {t.name}
                        {countryFlagEmoji(t.country_code) && (
                          <span aria-hidden className="ml-1.5">
                            {countryFlagEmoji(t.country_code)}
                          </span>
                        )}
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
                className="btn-primary mt-2"
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
