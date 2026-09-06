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
import { getApprovedTestimonials } from "@/lib/actions/testimonials";
import { getOrganizationJsonLd } from "@/lib/organizationSchema";
import { localeAlternates } from "@/lib/hreflang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Fallback safety net — admin testimonial changes trigger on-demand
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
    title: dict.meta.title,
    description: dict.meta.description,
    alternates: localeAlternates(locale),
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
  const testimonials = await getApprovedTestimonials();

  const jsonLd = getOrganizationJsonLd(dict.meta.description);

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <Hero dict={dict} />
        <AnimatedStats dict={dict} />
        <TrustBadges dict={dict} />
        <Services dict={dict} />
        <ProductCategories dict={dict} locale={locale} />
        <HowItWorks dict={dict} />
        <Pricing dict={dict} />
        <WhyUs dict={dict} />
        <LazyTestimonials dict={dict} testimonials={testimonials} />
        <LazyQuoteWizard dict={dict} />
        <LazyFAQ dict={dict} />
        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
