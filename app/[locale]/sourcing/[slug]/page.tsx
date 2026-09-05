import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { getPublishedCategory, getAllPublishedCategorySlugs } from "@/lib/actions/categoryPages";
import { getOrganizationJsonLd } from "@/lib/organizationSchema";

export async function generateStaticParams() {
  const slugs = await getAllPublishedCategorySlugs();
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
  const category = await getPublishedCategory(locale, slug);
  if (!category) return {};
  return {
    title: `${category.name} — The Unique Choice`,
    description: category.tagline,
    openGraph: {
      title: category.name,
      description: category.tagline,
      type: "website",
    },
  };
}

export default async function CategoryPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const category = await getPublishedCategory(locale, slug);

  if (!category) notFound();

  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: category.name,
    name: `${category.name} Sourcing`,
    description: category.tagline,
    provider: getOrganizationJsonLd(category.intro),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: dict.categories.title,
        item: `https://theuniquechoice.com/${locale}/sourcing`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: category.name,
        item: `https://theuniquechoice.com/${locale}/sourcing/${category.slug}`,
      },
    ],
  };

  const faqJsonLd =
    category.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: category.faq.map((item) => ({
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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/${locale}/sourcing`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {dict.categories.title}
            </Link>

            <h1 className="mt-6 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {category.name}
            </h1>
            <p className="mt-4 text-base text-muted sm:text-lg">
              {category.tagline}
            </p>
          </div>
        </section>

        <section className="px-4 pb-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <p className="text-sm leading-relaxed text-muted sm:text-base">
              {category.intro}
            </p>
          </div>
        </section>

        {category.highlights.length > 0 && (
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                What we handle
              </h2>
              <ul className="mt-4 flex flex-col gap-2 pl-1">
                {category.highlights.map((item) => (
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

        {category.faq.length > 0 && (
          <section className="px-4 py-6 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <h2 className="font-display text-xl font-semibold sm:text-2xl">
                FAQ
              </h2>
              <div className="mt-4 flex flex-col gap-4">
                {category.faq.map((item) => (
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
