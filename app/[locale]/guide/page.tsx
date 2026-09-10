import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import GuideDownloadForm from "@/components/GuideDownloadForm";
import { localeAlternates } from "@/lib/hreflang";
import { CheckCircle2 } from "lucide-react";

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
    title: `${dict.guide.title} — The Unique Choice`,
    description: dict.guide.subtitle,
    alternates: localeAlternates(locale, "/guide"),
  };
}

const includes = [
  "MOQs, lead times & certifications by product category",
  "The 5 Incoterms, explained in plain language",
  "The core shipping documents checklist",
  "The Chinese factory holiday calendar",
  "A standard deposit/production/QC/balance payment schedule",
];

export default async function GuidePage({
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
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.guide.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.guide.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.guide.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {includes.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-muted">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-md">
            <GuideDownloadForm locale={locale} />
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
