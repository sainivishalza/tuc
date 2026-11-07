import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import SourcingRequestForm from "@/components/SourcingRequestForm";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
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
    title: `${dict.sourcingRequests.form.title} — The Unique Choice`,
    description: dict.sourcingRequests.form.subtitle,
    alternates: localeAlternates(locale, "/sourcing-requests/new"),
  };
}

export default async function NewSourcingRequestPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [dict, categories] = await Promise.all([getDictionary(locale), getAllCategories()]);
  const t = dict.sourcingRequests.form;

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {t.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-5 text-base text-muted sm:text-lg">{t.subtitle}</p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <SourcingRequestForm dict={dict} categories={categories} />
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
