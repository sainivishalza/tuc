import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { CheckCircle, Globe, Shield } from "lucide-react";

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
    title: `${dict.about.title} — The Unique Choice`,
    description: dict.about.subtitle,
  };
}

const icons = [Shield, CheckCircle, Globe];

export default async function AboutPage({
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
        {/* Hero */}
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.about.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.about.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.about.subtitle}
            </p>
          </div>
        </section>

        {/* Story */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="glass-strong rounded-2xl p-8 sm:p-10">
              <p className="text-sm leading-relaxed text-muted sm:text-base">
                {dict.about.story}
              </p>
              <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">
                {dict.about.mission}
              </p>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">
              Our Values
            </h2>
            <p className="mt-3 text-sm text-muted sm:text-base">
              {dict.about.regions}
            </p>
            <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {dict.about.values.map((v, i) => {
                const Icon = icons[i % icons.length];
                return (
                  <div
                    key={v.title}
                    className="glass-strong flex flex-col gap-3 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/15 text-accent">
                      <Icon size={20} />
                    </div>
                    <h3 className="font-display text-sm font-semibold sm:text-base">
                      {v.title}
                    </h3>
                    <p className="text-xs leading-relaxed text-muted sm:text-sm">
                      {v.desc}
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
