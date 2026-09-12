import Link from "next/link";
import { getSiteTheme } from "@/lib/actions/theme";
import HeaderMobileMenu from "./HeaderMobileMenu";
import HeaderMoreMenu from "./HeaderMoreMenu";
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

  const pageLinks = [
    { href: `/${locale}#services`, label: dict.nav.services },
    { href: `/${locale}#pricing`, label: dict.nav.pricing },
    { href: `/${locale}#how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}#why-us`, label: dict.nav.whyUs },
    { href: `/${locale}#faq`, label: dict.nav.faq },
    { href: `/${locale}/blog`, label: dict.nav.blog },
  ];
  // Real pages, but lower-traffic than the anchor links above — grouped
  // under a "More" menu on desktop instead of competing for room in an
  // already nine-item-long nav row (still every one of these is also
  // linked from the footer's own site map).
  const moreLinks = [
    { href: `/${locale}/sourcing`, label: dict.categories.title },
    { href: `/${locale}/case-studies`, label: dict.caseStudies.title },
    { href: `/${locale}/track`, label: dict.nav.trackShipment },
  ];
  // Kept out of the primary nav row — an account link reads as a
  // different kind of action than a page link, so it sits beside the
  // language switcher instead of competing for room in an already-long
  // nav list. Still included in the mobile menu's full link list.
  const accountLink = { href: "/portal/login", label: "Client Login" };
  const links = [...pageLinks, ...moreLinks, accountLink];

  // Real figures already quoted in the hero stat panel — reused here as a
  // masthead ticker rather than restated as new/different numbers.
  const ticker = [
    { value: "10", label: dict.hero.stat1Label },
    { value: "3", label: dict.hero.stat2Label },
    { value: "< 24h", label: dict.hero.stat3Label },
  ];

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Masthead ticker — hidden on the smallest screens to keep the
          mobile header compact; the full nav row below always shows. */}
      <div className="hidden bg-brand-navy sm:block">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-1.5 text-[11px] font-medium text-white/60 sm:px-6">
          {ticker.map((t, i) => (
            <span key={t.label} className={`flex items-center gap-1.5 ${i > 0 ? "border-l border-white/15 pl-6" : ""}`}>
              <span className="font-display text-xs font-semibold text-accent">{t.value}</span>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      <div className="w-full border-b border-border bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
          <Link href={`/${locale}`} className="flex shrink-0 items-center gap-2.5">
            {theme.logo_url ? (
              // Fixed-size box regardless of the uploaded image's own
              // dimensions/aspect ratio — object-contain scales it to fit
              // without stretching or disturbing the header layout.
              <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded bg-white">
                <img src={theme.logo_url} alt="" className="h-full w-full object-contain" />
              </span>
            ) : (
              <span className="flex h-9 w-9 items-center justify-center rounded bg-brand-navy font-display text-base font-semibold text-white">
                U
              </span>
            )}
            <span className="font-display text-lg font-semibold tracking-tight whitespace-nowrap text-foreground sm:text-xl">
              <span className="text-accent">The Unique</span> Choice
            </span>
          </Link>

          <nav className="hidden items-center gap-6 lg:flex">
            {pageLinks.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative whitespace-nowrap text-sm font-medium text-foreground/70 transition hover:text-foreground"
              >
                {l.label}
                <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-accent transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
            <HeaderMoreMenu label={dict.nav.more} links={moreLinks} />
          </nav>

          <div className="hidden shrink-0 items-center gap-4 lg:flex">
            <a
              href={accountLink.href}
              className="whitespace-nowrap text-[13px] font-medium text-foreground/70 transition hover:text-foreground"
            >
              {accountLink.label}
            </a>
            <LanguageSwitcher locale={locale} />
            <a
              href={whatsappLink(dict.contact.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold"
            >
              <MessageCircle size={16} />
              {dict.nav.chatWhatsapp}
            </a>
          </div>

          <HeaderMobileMenu links={links} locale={locale} dict={dict} />
        </div>
      </div>
    </header>
  );
}
