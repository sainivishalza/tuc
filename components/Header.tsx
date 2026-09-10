import Link from "next/link";
import { getSiteTheme } from "@/lib/actions/theme";
import HeaderMobileMenu from "./HeaderMobileMenu";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import { MessageCircle } from "lucide-react";

export default async function Header({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
}) {
  const theme = await getSiteTheme();

  const links = [
    { href: `/${locale}#services`, label: dict.nav.services },
    { href: `/${locale}#pricing`, label: dict.nav.pricing },
    { href: `/${locale}#how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}#why-us`, label: dict.nav.whyUs },
    { href: `/${locale}#faq`, label: dict.nav.faq },
    { href: `/${locale}/sourcing`, label: dict.categories.title },
    { href: `/${locale}/case-studies`, label: dict.caseStudies.title },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/track`, label: dict.nav.trackShipment },
    { href: "/portal/login", label: "Client Login" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-white/85 backdrop-blur-md relative">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          {theme.logo_url ? (
            // Fixed-size box regardless of the uploaded image's own
            // dimensions/aspect ratio — object-contain scales it to fit
            // without stretching or disturbing the header layout.
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
              <img src={theme.logo_url} alt="" className="h-full w-full object-contain" />
            </span>
          ) : (
            <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg font-display text-base font-semibold text-white">
              U
            </span>
          )}
          <span className="font-display text-base font-semibold tracking-tight text-foreground sm:text-lg">
            <span className="text-brand-blue">The Unique</span> Choice
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-foreground/70 transition hover:text-foreground"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient-animated flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-accent/20 transition hover:scale-105"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>

        <HeaderMobileMenu links={links} locale={locale} dict={dict} />
      </div>
    </header>
  );
}
