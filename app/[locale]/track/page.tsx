import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import TrackingLookup from "@/components/TrackingLookup";
import { localeAlternates } from "@/lib/hreflang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.tracking.title} — The Unique Choice`,
    description: dict.tracking.subtitle,
    alternates: localeAlternates(locale, "/track"),
    robots: { index: false, follow: true },
  };
}

export default async function TrackPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.tracking.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.tracking.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.tracking.subtitle}
            </p>

            <div className="mt-10">
              <TrackingLookup dict={dict} />
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
