import type { Metadata } from "next";
import { jsonLdHtml } from "@/lib/jsonLd";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Building2 } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import LazyContactCTA from "@/components/LazyContactCTA";
import { getPublishedCaseStudy, getAllPublishedCaseStudySlugs } from "@/lib/actions/caseStudies";
import { localeAlternates } from "@/lib/hreflang";

export async function generateStaticParams() {
  const slugs = await getAllPublishedCaseStudySlugs();
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
  const caseStudy = await getPublishedCaseStudy(locale, slug);
  if (!caseStudy) return {};
  return {
    title: `${caseStudy.title} — The Unique Choice`,
    description: caseStudy.summary,
    alternates: localeAlternates(locale, `/case-studies/${slug}`),
    openGraph: {
      title: caseStudy.title,
      description: caseStudy.summary,
      type: "article",
    },
  };
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const caseStudy = await getPublishedCaseStudy(locale, slug);

  if (!caseStudy) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: caseStudy.title,
    description: caseStudy.summary,
    datePublished: caseStudy.published_at,
    about: caseStudy.industry,
    publisher: {
      "@type": "Organization",
      name: "The Unique Choice",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }}
      />
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-10 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link
              href={`/${locale}/case-studies`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {dict.caseStudies.title}
            </Link>

            <div className="mt-6 flex items-center gap-2 text-xs font-medium text-accent">
              <Building2 size={14} />
              {caseStudy.industry}
            </div>

            <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              {caseStudy.title}
            </h1>

            <p className="mt-4 text-sm text-muted sm:text-base">
              {caseStudy.client_name}
            </p>
          </div>
        </section>

        {caseStudy.results.length > 0 && (
          <section className="px-4 pb-10 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <div className="glass-strong grid grid-cols-2 gap-6 rounded-2xl p-6 sm:grid-cols-3">
                {caseStudy.results.map((r) => (
                  <div key={r.label}>
                    <p className="font-display text-2xl font-bold text-accent sm:text-3xl">{r.value}</p>
                    <p className="mt-1 text-xs text-muted sm:text-sm">{r.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              {dict.caseStudies.challengeLabel}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {caseStudy.challenge}
            </p>
          </div>
        </section>

        <section className="px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="font-display text-xl font-semibold sm:text-2xl">
              {dict.caseStudies.solutionLabel}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted sm:text-base">
              {caseStudy.solution}
            </p>
          </div>
        </section>

        <LazyContactCTA dict={dict} />
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
