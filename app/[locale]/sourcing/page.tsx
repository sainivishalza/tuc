import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublishedCategories } from "@/lib/actions/categoryPages";

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
    title: `${dict.categories.title} — The Unique Choice`,
    description: dict.categories.subtitle,
  };
}

export default async function SourcingIndexPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const categories = await getPublishedCategories(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: categories.map((cat, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `https://theuniquechoice.com/${locale}/sourcing/${cat.slug}`,
      name: cat.name,
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
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.categories.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.categories.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.categories.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {categories.length === 0 && (
              <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted">
                Category guides are on the way — check back soon.
              </div>
            )}
            <div className="grid grid-cols-1 gap-6">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${locale}/sourcing/${cat.slug}`}
                  className="glass-strong group flex flex-col gap-2 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <h2 className="font-display text-lg font-semibold sm:text-xl">
                    {cat.name}
                  </h2>
                  <p className="text-sm text-muted sm:text-base">{cat.tagline}</p>
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
