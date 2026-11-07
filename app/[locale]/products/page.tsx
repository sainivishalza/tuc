import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import ProductsCatalogBoard from "@/components/ProductsCatalogBoard";
import { getPublicProducts } from "@/lib/actions/supplierProducts";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
import { localeAlternates } from "@/lib/hreflang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Fallback safety net — create/update/delete actions revalidate on-demand
// already, this just guards against a missed call, same as /suppliers and
// /sourcing-requests.
export const revalidate = 3600;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  return {
    title: `${dict.products.catalog.title} — The Unique Choice`,
    description: dict.products.catalog.subtitle,
    alternates: localeAlternates(locale, "/products"),
  };
}

export default async function ProductsCatalogPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const [dict, products, categories] = await Promise.all([
    getDictionary(locale),
    getPublicProducts(),
    getAllCategories(),
  ]);
  const t = dict.products.catalog;

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {t.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">{t.title}</h1>
            <p className="mt-5 text-base text-muted sm:text-lg">{t.subtitle}</p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl">
            <ProductsCatalogBoard dict={dict} locale={locale} products={products} categories={categories} />
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
