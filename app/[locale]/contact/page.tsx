import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { whatsappLink } from "@/lib/whatsapp";
import { getOrganizationJsonLd } from "@/lib/organizationSchema";
import { localeAlternates } from "@/lib/hreflang";
import { MessageCircle, Mail, Phone, Clock, MapPin } from "lucide-react";

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
    title: `${dict.contactPage.badge} — The Unique Choice`,
    description: dict.contactPage.subtitle,
    alternates: localeAlternates(locale, "/contact"),
  };
}

const channelIcons = [MessageCircle, Mail, Phone];

export default async function ContactPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const jsonLd = getOrganizationJsonLd(dict.contactPage.subtitle);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        {/* Hero */}
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.contactPage.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.contactPage.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.contactPage.subtitle}
            </p>
            <a
              href={whatsappLink(dict.contact.whatsappMessage)}
              target="_blank"
              rel="noopener noreferrer"
              className="brand-gradient-animated mt-8 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-105 hover:shadow-accent/30"
            >
              <MessageCircle size={18} />
              {dict.contactPage.whatsappCta}
            </a>
          </div>
        </section>

        {/* Contact Channels */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dict.contactPage.channels.map((ch, i) => {
                const Icon = channelIcons[i % channelIcons.length];
                return (
                  <div
                    key={ch.label}
                    className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-6 text-center transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Icon size={22} />
                    </div>
                    <h3 className="font-display text-sm font-bold uppercase tracking-wider text-muted">
                      {ch.label}
                    </h3>
                    <p className="font-display text-base font-semibold">
                      {ch.value}
                    </p>
                    <p className="text-xs text-muted sm:text-sm">{ch.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Hours & Regions */}
        <section className="px-4 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong flex flex-col gap-6 rounded-2xl p-8 sm:p-10">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Clock size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">
                    Business Hours
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {dict.contactPage.hours}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-display text-sm font-semibold">
                    Service Regions
                  </h3>
                  <p className="mt-1 text-sm text-muted">
                    {dict.contactPage.regions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
