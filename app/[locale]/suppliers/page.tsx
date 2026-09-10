import type { Metadata } from "next";
import Link from "next/link";
import { ShieldCheck, FileCheck2 } from "lucide-react";
import { locales, getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getApprovedSuppliers } from "@/lib/actions/suppliers";
import { localeAlternates } from "@/lib/hreflang";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

// Fallback safety net — admin approve/reject actions trigger on-demand
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
    title: `${dict.suppliers.directory.title} — The Unique Choice`,
    description: dict.suppliers.directory.subtitle,
    alternates: localeAlternates(locale, "/suppliers"),
  };
}

export default async function SuppliersDirectoryPage({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const suppliers = await getApprovedSuppliers();

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-16 sm:px-6">
          <div className="mx-auto max-w-3xl text-center">
            <span className="brand-gradient mb-4 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-white">
              {dict.suppliers.directory.badge}
            </span>
            <h1 className="font-display text-3xl font-bold tracking-tight sm:text-5xl">
              {dict.suppliers.directory.title}
            </h1>
            <p className="mt-5 text-base text-muted sm:text-lg">
              {dict.suppliers.directory.subtitle}
            </p>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-5xl">
            {suppliers.length === 0 && (
              <div className="glass-strong rounded-2xl p-8 text-center text-sm text-muted">
                {dict.suppliers.directory.emptyState}
              </div>
            )}
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {suppliers.map((s) => (
                <div key={s.id} className="glass-strong flex flex-col gap-3 rounded-2xl p-6">
                  {s.company_photo_url ? (
                    <img
                      src={s.company_photo_url}
                      alt={s.company_name}
                      className="h-36 w-full rounded-xl object-cover"
                    />
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                      <ShieldCheck size={32} />
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                    <ShieldCheck size={14} />
                    {dict.suppliers.directory.verifiedLabel}
                  </div>
                  <h3 className="font-display text-base font-semibold">{s.company_name}</h3>
                  {s.product_categories && (
                    <p className="text-sm text-muted">{s.product_categories}</p>
                  )}
                  {s.business_license_url && (
                    <a
                      href={s.business_license_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:opacity-80"
                    >
                      <FileCheck2 size={12} />
                      View business license
                    </a>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-12 text-center">
              <Link
                href={`/${locale}/suppliers/register`}
                className="text-sm font-medium text-accent hover:opacity-80"
              >
                Are you a supplier? Get listed →
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
