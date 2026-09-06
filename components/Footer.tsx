import Link from "next/link";
import { MessageCircle } from "lucide-react";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-surface-2 text-foreground/80">
      <div className="border-b border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              {dict.footer.tagline}
            </h3>
            <p className="mt-1 text-sm text-muted">{dict.nav.chatWhatsapp}</p>
          </div>
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="gradient-brand flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/25 transition hover:scale-105"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.1fr_1fr_1fr_1fr]">
          <div className="max-w-sm">
            <Link href={`/${locale}`} className="flex items-center gap-2.5">
              <span className="gradient-brand flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-semibold text-white">
                U
              </span>
              <span className="font-display text-base font-semibold text-foreground">
                <span className="text-emerald-600">The Unique</span> Choice
              </span>
            </Link>
            <p className="mt-3 text-sm text-muted">{dict.footer.tagline}</p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {dict.footer.servicesLabel}
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
              {dict.services.items.slice(0, 5).map((s) => (
                <li key={s.title}>{s.title}</li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {dict.footer.companyLabel}
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
              <li>
                <Link href={`/${locale}/about`} className="hover:text-foreground">
                  {dict.nav.about}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="hover:text-foreground">
                  {dict.nav.contactPage}
                </Link>
              </li>
              <li>
                <a href={`/${locale}#services`} className="hover:text-foreground">
                  {dict.nav.services}
                </a>
              </li>
              <li>
                <a href={`/${locale}#faq`} className="hover:text-foreground">
                  {dict.nav.faq}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              {dict.footer.resourcesLabel}
            </h4>
            <ul className="mt-3 flex flex-col gap-2 text-sm text-foreground/80">
              <li>
                <Link href={`/${locale}/blog`} className="hover:text-foreground">
                  {dict.nav.blog}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sourcing`} className="hover:text-foreground">
                  {dict.categories.title}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/glossary`} className="hover:text-foreground">
                  {dict.glossary.title}
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/track`} className="hover:text-foreground">
                  {dict.nav.trackShipment}
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-border px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-6xl text-xs text-muted">
          © {year} The Unique Choice. {dict.footer.rights}
        </div>
      </div>
    </footer>
  );
}
