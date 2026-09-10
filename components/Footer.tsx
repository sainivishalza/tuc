import Link from "next/link";
import { MessageCircle } from "lucide-react";
import { getSiteTheme } from "@/lib/actions/theme";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";
import NewsletterForm from "./NewsletterForm";

export default async function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const theme = await getSiteTheme();
  const year = new Date().getFullYear();

  return (
    <footer>
      {/* This CTA strip stays on the page's own light background — only
          the footer content below it (logo, link columns, copyright)
          switches to the dark band, so the dark tone reads as "the
          footer" and not as a continuation of whatever section sits
          above it on the page. */}
      <div className="border-b border-border bg-background px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div>
            <h3 className="font-display text-base font-semibold text-foreground">
              {dict.footer.tagline}
            </h3>
          </div>
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient-animated flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-accent/20 transition hover:scale-105"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>
      </div>

      <div className="bg-brand-navy text-white/70">
        <div className="px-4 py-12 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-[1.1fr_1fr_1fr_1fr]">
            <div className="max-w-sm">
              <Link href={`/${locale}`} className="flex items-center gap-2.5">
                {theme.logo_url ? (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white">
                    <img src={theme.logo_url} alt="" className="h-full w-full object-contain" />
                  </span>
                ) : (
                  <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg font-display text-sm font-semibold text-white">
                    U
                  </span>
                )}
                <span className="font-display text-base font-semibold text-white">
                  <span className="text-brand-blue">The Unique</span> Choice
                </span>
              </Link>
              <p className="mt-3 text-sm text-white/60">{dict.footer.tagline}</p>
              <NewsletterForm dict={dict} locale={locale} />
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                {dict.footer.servicesLabel}
              </h4>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                {dict.services.items.slice(0, 5).map((s) => (
                  <li key={s.title}>{s.title}</li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                {dict.footer.companyLabel}
              </h4>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                <li>
                  <Link href={`/${locale}/about`} className="hover:text-white">
                    {dict.nav.about}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/contact`} className="hover:text-white">
                    {dict.nav.contactPage}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/security`} className="hover:text-white">
                    {dict.security.title}
                  </Link>
                </li>
                <li>
                  <a href={`/${locale}#services`} className="hover:text-white">
                    {dict.nav.services}
                  </a>
                </li>
                <li>
                  <a href={`/${locale}#faq`} className="hover:text-white">
                    {dict.nav.faq}
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white/40">
                {dict.footer.resourcesLabel}
              </h4>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-white/70">
                <li>
                  <Link href={`/${locale}/guide`} className="hover:text-white">
                    {dict.guide.navLabel}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/case-studies`} className="hover:text-white">
                    {dict.caseStudies.title}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/blog`} className="hover:text-white">
                    {dict.nav.blog}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/sourcing`} className="hover:text-white">
                    {dict.categories.title}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/glossary`} className="hover:text-white">
                    {dict.glossary.title}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/shipping`} className="hover:text-white">
                    {dict.shipping.title}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/suppliers`} className="hover:text-white">
                    {dict.suppliers.navLabel}
                  </Link>
                </li>
                <li>
                  <Link href={`/${locale}/track`} className="hover:text-white">
                    {dict.nav.trackShipment}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-6xl text-xs text-white/40">
            © {year} The Unique Choice. {dict.footer.rights}
          </div>
        </div>
      </div>
    </footer>
  );
}
