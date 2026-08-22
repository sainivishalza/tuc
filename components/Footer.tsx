import Link from "next/link";
import type { Dictionary, Locale } from "@/lib/i18n";

export default function Footer({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border px-4 py-12 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 sm:flex-row sm:justify-between">
        <div className="max-w-sm">
          <Link href={`/${locale}`} className="flex items-center gap-2">
            <span className="brand-gradient flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold text-white">
              TU
            </span>
            <span className="font-display text-base font-bold">The Unique Choice</span>
          </Link>
          <p className="mt-3 text-sm text-muted">{dict.footer.tagline}</p>
        </div>

        <div className="flex gap-12">
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
                <a href="#services" className="hover:text-foreground">
                  {dict.nav.services}
                </a>
              </li>
              <li>
                <a href="#why-us" className="hover:text-foreground">
                  {dict.nav.whyUs}
                </a>
              </li>
              <li>
                <a href="#faq" className="hover:text-foreground">
                  {dict.nav.faq}
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground">
                  {dict.nav.contact}
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-10 max-w-6xl border-t border-border pt-6 text-xs text-muted">
        © {year} The Unique Choice. {dict.footer.rights}
      </div>
    </footer>
  );
}
