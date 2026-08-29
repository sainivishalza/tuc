import type { Metadata } from "next";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  return {
    title: "Analytics — The Unique Choice",
    description: "Internal analytics dashboard for The Unique Choice.",
    robots: { index: false, follow: false },
  };
}

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main className="min-h-screen px-4 pt-28 pb-16 sm:px-6">
        <div className="mx-auto max-w-4xl">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">
            Analytics
          </h1>
          <p className="mt-2 text-sm text-muted">
            Page views and CTA clicks tracked locally. Data stays in your
            browser.
          </p>
          <AnalyticsDashboard />
        </div>
      </main>
      <Footer dict={dict} locale={locale} />
    </>
  );
}
