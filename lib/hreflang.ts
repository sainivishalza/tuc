import { locales, defaultLocale, type Locale } from "@/lib/i18n";

/**
 * Builds the `alternates` metadata block (canonical + hreflang) for a
 * locale-prefixed page. `restPath` is everything after `/${locale}`,
 * e.g. "" for the homepage, "/about", or `/blog/${slug}`.
 *
 * Assumes the same slug exists across all locales, matching the
 * assumption LanguageSwitcher already makes when switching locales.
 */
export function localeAlternates(locale: Locale, restPath: string = "") {
  const languages: Record<string, string> = {};
  for (const l of locales) languages[l] = `/${l}${restPath}`;
  languages["x-default"] = `/${defaultLocale}${restPath}`;

  return {
    canonical: `/${locale}${restPath}`,
    languages,
  };
}
