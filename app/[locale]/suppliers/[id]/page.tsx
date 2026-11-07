import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, FileCheck2, MapPin, Tags, PackageX } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import WhatsAppInquireButton from "@/components/WhatsAppInquireButton";
import { getApprovedSupplierById } from "@/lib/actions/suppliers";
import { getProductsBySupplier } from "@/lib/actions/supplierProducts";
import { localeAlternates } from "@/lib/hreflang";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const supplier = await getApprovedSupplierById(id);
  return {
    title: supplier ? `${supplier.company_name} — The Unique Choice` : `${dict.suppliers.directory.title} — The Unique Choice`,
    description: supplier?.bio?.slice(0, 160) ?? dict.suppliers.directory.subtitle,
    alternates: localeAlternates(locale, `/suppliers/${id}`),
  };
}

export default async function SupplierDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const [dict, supplier, products] = await Promise.all([
    getDictionary(locale),
    getApprovedSupplierById(id),
    getProductsBySupplier(id),
  ]);
  const t = dict.suppliers.detail;

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <Link
              href={`/${locale}/suppliers`}
              className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground"
            >
              <ArrowLeft size={14} />
              {t.backLabel}
            </Link>

            {!supplier ? (
              <div className="glass-strong rounded-2xl px-6 py-16 text-center text-sm text-muted">{t.notFound}</div>
            ) : (
              <div className="glass-strong rounded-2xl p-6 sm:p-8">
                {supplier.company_photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={supplier.company_photo_url}
                    alt={supplier.company_name}
                    className="h-48 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-48 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                    <ShieldCheck size={40} />
                  </div>
                )}

                <div className="mt-5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-accent">
                  <ShieldCheck size={14} />
                  {dict.suppliers.directory.verifiedLabel}
                </div>

                <h1 className="font-display mt-2 text-2xl font-bold sm:text-3xl">{supplier.company_name}</h1>

                <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted">
                  {supplier.product_categories && (
                    <span className="flex items-center gap-1.5">
                      <Tags size={13} />
                      {supplier.product_categories}
                    </span>
                  )}
                  {(supplier.business_address || supplier.country) && (
                    <span className="flex items-center gap-1.5">
                      <MapPin size={13} />
                      {[supplier.business_address, supplier.country].filter(Boolean).join(", ")}
                    </span>
                  )}
                </div>

                {supplier.bio && (
                  <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-muted">{supplier.bio}</p>
                )}

                {supplier.gallery_urls.length > 0 && (
                  <div className="mt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.galleryHeading}</p>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                      {supplier.gallery_urls.map((url) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={url} src={url} alt="" className="h-28 w-full rounded-lg object-cover" />
                      ))}
                    </div>
                  </div>
                )}

                {supplier.business_license_url && (
                  <a
                    href={supplier.business_license_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-6 inline-flex items-center gap-1.5 text-xs font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:opacity-80"
                  >
                    <FileCheck2 size={12} />
                    View business license
                  </a>
                )}

                <div className="mt-6">
                  <WhatsAppInquireButton
                    message={`Hi! I'm interested in working with ${supplier.company_name}.`}
                    label={t.contactCta}
                    entityType="supplier"
                    entityId={supplier.id}
                    supplierId={supplier.id}
                    supplierCompanyName={supplier.company_name}
                  />
                </div>

                {products.length > 0 && (
                  <div className="mt-8 border-t border-border pt-6">
                    <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t.productsHeading}</p>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      {products.map((p) => (
                        <Link
                          key={p.id}
                          href={`/${locale}/products/${p.id}`}
                          className="group flex flex-col gap-1.5 rounded-xl border border-border p-2.5 transition hover:border-accent/40"
                        >
                          {p.image_urls[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_urls[0]} alt={p.title} className="h-20 w-full rounded-lg object-cover" />
                          ) : (
                            <div className="flex h-20 w-full items-center justify-center rounded-lg bg-surface-2 text-muted">
                              <PackageX size={18} />
                            </div>
                          )}
                          <p className="line-clamp-2 text-xs font-medium">{p.title}</p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer dict={dict} locale={locale} />
      <WhatsAppFloat message={dict.contact.whatsappMessage} />
    </>
  );
}
