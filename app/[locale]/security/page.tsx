import type { Metadata } from "next";
import { jsonLdHtml } from "@/lib/jsonLd";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { getOrganizationJsonLd } from "@/lib/organizationSchema";
import { localeAlternates } from "@/lib/hreflang";
import { Lock, ShieldCheck, Bot, FileCheck2, KeyRound, SearchCheck } from "lucide-react";

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
    title: `${dict.security.title} — The Unique Choice`,
    description: dict.security.subtitle,
    alternates: localeAlternates(locale, "/security"),
  };
}

const icons = [Lock, ShieldCheck, Bot, FileCheck2, KeyRound, SearchCheck];

export default async function SecurityPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const jsonLd = getOrganizationJsonLd(dict.security.subtitle);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        {/* Hero */}
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.security.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.security.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.security.subtitle}
            </p>
          </div>
        </section>

        {/* Practices */}
        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {dict.security.practices.map((p, i) => {
                const Icon = icons[i % icons.length];
                return (
                  <div
                    key={p.title}
                    className="glass-strong flex flex-col gap-3 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display text-sm font-semibold sm:text-base">
                      {p.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted sm:text-sm">
                      {p.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
