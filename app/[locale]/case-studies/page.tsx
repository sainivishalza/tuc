import type { Metadata } from "next";
import Link from "next/link";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublishedCaseStudies } from "@/lib/actions/caseStudies";
import { localeAlternates } from "@/lib/hreflang";
import { ArrowRight } from "lucide-react";

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
    title: `${dict.caseStudies.title} — The Unique Choice`,
    description: dict.caseStudies.subtitle,
    alternates: localeAlternates(locale, "/case-studies"),
  };
}

export default async function CaseStudiesPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const caseStudies = await getPublishedCaseStudies(locale);

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.caseStudies.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.caseStudies.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.caseStudies.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            {caseStudies.length === 0 && (
              <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted">
                {dict.caseStudies.emptyState}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6">
              {caseStudies.map((cs) => (
                <Link
                  key={cs.slug}
                  href={`/${locale}/case-studies/${cs.slug}`}
                  className="glass-strong group flex flex-col gap-4 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <article>
                    <div className="flex items-center gap-3 text-xs text-muted">
                      <span className="font-medium text-accent">{cs.industry}</span>
                      <span>·</span>
                      <span>{cs.client_name}</span>
                    </div>
                    <h2 className="mt-3 font-display text-lg font-semibold sm:text-xl">
                      {cs.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted sm:text-base">
                      {cs.summary}
                    </p>
                    {cs.results.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-4">
                        {cs.results.slice(0, 3).map((r) => (
                          <div key={r.label}>
                            <p className="font-display text-lg font-bold text-accent">{r.value}</p>
                            <p className="text-xs text-muted">{r.label}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-accent transition group-hover:gap-2">
                      {dict.caseStudies.readMore}
                      <ArrowRight size={14} />
                    </span>
                  </article>
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
