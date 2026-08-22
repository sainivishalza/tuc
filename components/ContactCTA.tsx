import { MessageCircle, Phone } from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { whatsappLink, WHATSAPP_DISPLAY } from "@/lib/whatsapp";

export default function ContactCTA({ dict }: { dict: Dictionary }) {
  return (
    <section id="contact" className="relative px-4 py-20 sm:px-6">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl">
        <div className="brand-gradient absolute inset-0" />
        <div className="absolute inset-0 bg-black/10" />
        <Reveal className="relative flex flex-col items-center gap-4 px-6 py-16 text-center text-white sm:py-20">
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">
            {dict.contact.badge}
          </span>
          <h2 className="font-display max-w-xl text-2xl font-extrabold tracking-tight sm:text-4xl">
            {dict.contact.title}
          </h2>
          <p className="max-w-md text-sm text-white/85 sm:text-base">{dict.contact.subtitle}</p>

          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-brand-red shadow-lg transition hover:scale-[1.03]"
          >
            <MessageCircle size={18} />
            {dict.contact.whatsappCta}
          </a>

          <div className="mt-2 flex items-center gap-2 text-xs text-white/80 sm:text-sm">
            <Phone size={14} />
            {dict.contact.whatsappNumberLabel} {WHATSAPP_DISPLAY}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
