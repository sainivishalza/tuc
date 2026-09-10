import type { Metadata } from "next";
import { jsonLdHtml } from "@/lib/jsonLd";
import Link from "next/link";
import { ArrowRight, Ship } from "lucide-react";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublishedRoutes } from "@/lib/actions/shippingRoutes";
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
    title: `${dict.shipping.title} — The Unique Choice`,
    description: dict.shipping.subtitle,
    alternates: localeAlternates(locale, "/shipping"),
  };
}

export default async function ShippingRoutesIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const routes = await getPublishedRoutes(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: routes.map((r, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://theuniquechoice.com/${locale}/shipping/${r.slug}`,
      name: r.destination_name,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.shipping.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.shipping.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.shipping.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {routes.length === 0 && (
              <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted">
                Route guides are on the way — check back soon.
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {routes.map((r) => (
                <Link
                  key={r.slug}
                  href={`/${locale}/shipping/${r.slug}`}
                  className="glass-strong group flex flex-col gap-2 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="flex items-center gap-2 text-accent">
                    <Ship size={16} />
                    <h2 className="font-display text-lg font-semibold text-foreground sm:text-xl">
                      {r.destination_name}
                    </h2>
                  </div>
                  <p className="text-sm text-muted sm:text-base">{r.tagline}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-accent transition group-hover:gap-2">
                    {dict.blog.readMore}
                    <ArrowRight size={14} />
                  </span>
                </Link>
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
