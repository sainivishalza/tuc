import type { Metadata } from "next";
import { jsonLdHtml } from "@/lib/jsonLd";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Ship, Plane, Zap } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { getPublishedRoute, getAllPublishedRouteSlugs } from "@/lib/actions/shippingRoutes";
import { getOrganizationJsonLd } from "@/lib/organizationSchema";
import { localeAlternates } from "@/lib/hreflang";

export async function generateStaticParams() {
  const slugs = await getAllPublishedRouteSlugs();
  return slugs.map(({ locale, slug }) => ({ locale, slug }));
}

// Fallback safety net — admin publish/edit actions trigger on-demand
// revalidation immediately, this just guards against a missed call.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const route = await getPublishedRoute(locale, slug);
  if (!route) return {};
  return {
    title: `Shipping from China to ${route.destination_name} — The Unique Choice`,
    description: route.tagline,
    alternates: localeAlternates(locale, `/shipping/${slug}`),
    openGraph: {
      title: `Shipping from China to ${route.destination_name}`,
      description: route.tagline,
      type: "website",
    },
  };
}

export default async function ShippingRoutePage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const route = await getPublishedRoute(locale, slug);

  if (!route) notFound();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: `Shipping to ${route.destination_name}`,
    name: `China to ${route.destination_name} Shipping`,
    description: route.tagline,
    provider: getOrganizationJsonLd(route.intro),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.shipping.title,
        item: `https://theuniquechoice.com/${locale}/shipping`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: route.destination_name,
        item: `https://theuniquechoice.com/${locale}/shipping/${route.slug}`,
      },
    ],
  };

  const faqJsonLd =
    route.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: route.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLdHtml(faqJsonLd) }}
        />
      )}
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/${locale}/shipping`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {dict.shipping.title}
            </Link>

            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Shipping from China to {route.destination_name}
            </h1>
            <p className="mt-4 text-base text-muted sm:text-lg">
              {route.tagline}
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
                <Ship size={20} className="text-accent" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.shipping.seaLabel}</p>
                <p className="font-display text-lg font-bold">{route.sea_transit}</p>
              </div>
              <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
                <Plane size={20} className="text-accent" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.shipping.airLabel}</p>
                <p className="font-display text-lg font-bold">{route.air_transit}</p>
              </div>
              <div className="glass-strong flex flex-col items-center gap-2 rounded-2xl p-5 text-center">
                <Zap size={20} className="text-accent" />
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">{dict.shipping.expressLabel}</p>
                <p className="font-display text-lg font-bold">{route.express_transit}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              {route.intro}
            </p>
          </div>
        </section>

        {route.highlights.length > 0 && (
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                What we handle
              </h2>
              <ul className="mt-4 flex flex-col gap-2 pl-1">
                {route.highlights.map((item) => (
                  <li
                    key={item}
                    className="flex gap-2 text-sm leading-relaxed text-muted sm:text-base"
                  >
                    <span className="text-accent">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {route.faq.length > 0 && (
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                FAQ
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {route.faq.map((item) => (
                  <div key={item.q}>
                    <p className="font-display text-sm font-semibold sm:text-base">
                      {item.q}
                    </p>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted sm:text-base">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
