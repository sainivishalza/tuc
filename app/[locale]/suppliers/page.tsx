import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck, FileCheck2 } from "lucide-react";
import SupplierTierBadge from "@/components/SupplierTierBadge";
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
                <Link
                  key={s.id}
                  href={`/${locale}/suppliers/${s.id}`}
                  className="glass-strong flex flex-col gap-3 rounded-2xl p-6 transition hover:shadow-lg"
                >
                  {s.company_photo_url ? (
                    <div className="relative h-36 w-full overflow-hidden rounded-xl">
                      <Image
                        src={s.company_photo_url}
                        alt={s.company_name}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-36 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                      <ShieldCheck size={32} />
                    </div>
                  )}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                      <ShieldCheck size={14} />
                      {dict.suppliers.directory.verifiedLabel}
                    </span>
                    <SupplierTierBadge tier={s.tier} labels={{ gold: dict.suppliers.directory.tierGold, premium: dict.suppliers.directory.tierPremium }} />
                  </div>
                  <h3 className="font-display text-base font-semibold">{s.company_name}</h3>
                  {s.product_categories && (
                    <p className="text-sm text-muted">{s.product_categories}</p>
                  )}
                  {s.bio && <p className="line-clamp-2 text-sm text-muted/80">{s.bio}</p>}
                  {s.business_license_url && (
                    <span className="mt-1 inline-flex items-center gap-1.5 text-xs font-medium text-accent">
                      <FileCheck2 size={12} />
                      Verified license on file
                    </span>
                  )}
                </Link>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center gap-2 text-center">
              <Link
                href={`/${locale}/suppliers/register`}
                className="text-sm font-medium text-accent hover:opacity-80"
              >
                Are you a supplier? Get listed →
              </Link>
              <Link href="/supplier-portal/login" className="text-sm font-medium text-muted hover:text-foreground">
                Already applied? Sign in to your supplier account
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
