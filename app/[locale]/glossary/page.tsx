import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublishedGlossaryTerms } from "@/lib/actions/glossaryTerms";
import { localeAlternates } from "@/lib/hreflang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Fallback safety net — admin publish/edit actions trigger on-demand
// revalidation immediately, this just guards against a missed call.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.glossary.title} — The Unique Choice`,
    description: dict.glossary.subtitle,
    alternates: localeAlternates(locale, "/glossary"),
  };
}

export default async function GlossaryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const terms = await getPublishedGlossaryTerms(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: dict.glossary.title,
    description: dict.glossary.subtitle,
    hasDefinedTerm: terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.term,
      description: t.definition,
      url: `https://theuniquechoice.com/${locale}/glossary#${t.slug}`,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.glossary.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.glossary.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.glossary.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {terms.length === 0 && (
              <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted">
                Glossary terms are on the way — check back soon.
              </div>
            )}
            <div className="flex flex-col divide-y divide-border">
              {terms.map((t) => (
                <div key={t.slug} id={t.slug} className="scroll-mt-24 py-5">
                  <h2 className="font-display text-base font-semibold sm:text-lg">
                    {t.term}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted sm:text-base">
                    {t.definition}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
