import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import AnimatedStats from "@/components/AnimatedStats";
import TrustBadges from "@/components/TrustBadges";
import Services from "@/components/Services";
import ProductCategories from "@/components/ProductCategories";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";
import WhyUs from "@/components/WhyUs";
import LazyTestimonials from "@/components/LazyTestimonials";
import LazyQuoteWizard from "@/components/LazyQuoteWizard";
import LazyFAQ from "@/components/LazyFAQ";
import LazyContactCTA from "@/components/LazyContactCTA";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";

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
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: {
      languages: Object.fromEntries(locales.map((l) => [l, `/${l}`])),
    },
    openGraph: {
      title: dict.meta.title,
      description: dict.meta.description,
      locale,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: dict.meta.title,
      description: dict.meta.description,
    },
  };
}

export default async function LocalePage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "The Unique Choice",
    description: dict.meta.description,
    areaServed: ["Hong Kong", "India", "South Africa"],
    sameAs: [] as string[],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <Hero dict={dict} />
        <AnimatedStats />
        <TrustBadges />
        <Services dict={dict} />
        <ProductCategories dict={dict} />
        <HowItWorks dict={dict} />
        <Pricing dict={dict} />
        <WhyUs dict={dict} />
        <LazyTestimonials dict={dict} />
        <LazyQuoteWizard dict={dict} />
        <LazyFAQ dict={dict} />
        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
