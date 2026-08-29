"use client";

import { Check, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";

export default function Pricing({ dict }: { dict: Dictionary }) {
  return (
    <section id="pricing" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          badge={dict.pricing.badge}
          title={dict.pricing.title}
          subtitle={dict.pricing.subtitle}
        />

        <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-3">
          {dict.pricing.plans.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <div
                className={`glass-strong flex h-full flex-col rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 ${
                  i === 1
                    ? "relative border-2 border-accent/50 shadow-lg shadow-accent/10"
                    : ""
                }`}
              >
                {i === 1 && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}

                <h3 className="font-display text-lg font-semibold">
                  {plan.name}
                </h3>
                <div className="mt-3">
                  <span className="font-display text-4xl font-bold text-accent">
                    {plan.commission}
                  </span>
                  {plan.commission !== "Custom" && (
                    <span className="text-sm text-muted"> commission</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-muted">{plan.desc}</p>

                <ul className="mt-6 flex flex-1 flex-col gap-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check
                        size={16}
                        className="mt-0.5 shrink-0 text-accent"
                      />
                      <span className="text-foreground/80">{feature}</span>
                    </li>
                  ))}
                </ul>

                <a
                  href={whatsappLink(dict.contact.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`mt-6 flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition ${
                    i === 1
                      ? "brand-gradient text-white shadow-lg shadow-accent/20"
                      : "border border-border text-foreground hover:bg-surface-2"
                  }`}
                >
                  <MessageCircle size={16} />
                  {dict.pricing.cta}
                </a>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
