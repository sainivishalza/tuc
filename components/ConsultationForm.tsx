"use client";

import { useState } from "react";
import { Send, CheckCircle, MessageCircle } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";

export default function ConsultationForm({ dict }: { dict: Dictionary }) {
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname() ?? "/";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackCtaClick("Consultation Form Submit", pathname);
    setSubmitted(true);
  };

  return (
    <section id="consultation" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge={dict.consultation.badge}
          title={dict.consultation.title}
          subtitle={dict.consultation.subtitle}
        />

        <Reveal delay={0.15} className="mt-10">
          {submitted ? (
            <div className="glass-strong flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
                <CheckCircle size={28} />
              </div>
              <h3 className="font-display text-xl font-semibold">
                {dict.consultation.form.success}
              </h3>
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
          ) : (
            <form
              onSubmit={handleSubmit}
              className="glass-strong flex flex-col gap-4 rounded-2xl p-6 sm:p-8"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder={dict.consultation.form.name}
                  required
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="email"
                  placeholder={dict.consultation.form.email}
                  required
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <input
                  type="tel"
                  placeholder={dict.consultation.form.whatsapp}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <select
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {dict.consultation.form.product}
                  </option>
                  <option value="electronics">Electronics & Gadgets</option>
                  <option value="home">Home & Kitchen</option>
                  <option value="fashion">Fashion & Textiles</option>
                  <option value="building">Building Materials</option>
                  <option value="packaging">Packaging & Printing</option>
                  <option value="auto">Auto Parts & Tools</option>
                  <option value="other">Other</option>
                </select>
                <input
                  type="text"
                  placeholder={dict.consultation.form.quantity}
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <select
                  className="rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  defaultValue=""
                >
                  <option value="" disabled>
                    {dict.consultation.form.timeline}
                  </option>
                  <option value="asap">ASAP</option>
                  <option value="1month">Within 1 month</option>
                  <option value="3months">Within 3 months</option>
                  <option value="6months">Within 6 months</option>
                  <option value="exploring">Just exploring</option>
                </select>
              </div>
              <textarea
                placeholder={dict.consultation.form.message}
                rows={3}
                className="resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                type="submit"
                className="brand-gradient-animated flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
              >
                <Send size={16} />
                {dict.consultation.form.submit}
              </button>
              <p className="text-center text-xs text-muted">
                {dict.consultation.guarantee}
              </p>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  );
}
