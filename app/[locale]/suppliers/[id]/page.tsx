import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ShieldCheck, FileCheck2, MapPin, Tags, PackageX, Star } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import WhatsAppInquireButton from "@/components/WhatsAppInquireButton";
import SupplierReviewForm from "@/components/SupplierReviewForm";
import { getApprovedSupplierById } from "@/lib/actions/suppliers";
import { getProductsBySupplier } from "@/lib/actions/supplierProducts";
import { getApprovedReviewsForSupplier } from "@/lib/actions/supplierReviews";
import { localeAlternates } from "@/lib/hreflang";
import { jsonLdHtml } from "@/lib/jsonLd";

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
  const [dict, supplier, products, reviewSummary] = await Promise.all([
    getDictionary(locale),
    getApprovedSupplierById(id),
    getProductsBySupplier(id),
    getApprovedReviewsForSupplier(id),
  ]);
  const t = dict.suppliers.detail;

  const jsonLd = supplier
    ? {
        "@context": "https://schema.org",
        "@type": "Organization",
        name: supplier.company_name,
        description: supplier.bio || undefined,
        image: supplier.company_photo_url || undefined,
        address: [supplier.business_address, supplier.country].filter(Boolean).join(", ") || undefined,
        aggregateRating:
          reviewSummary.average !== null
            ? {
                "@type": "AggregateRating",
                ratingValue: reviewSummary.average.toFixed(1),
                reviewCount: reviewSummary.count,
              }
            : undefined,
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdHtml(jsonLd) }} />
      )}
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
                  <div className="relative h-48 w-full overflow-hidden rounded-xl">
                    <Image
                      src={supplier.company_photo_url}
                      alt={supplier.company_name}
                      fill
                      sizes="(max-width: 768px) 100vw, 672px"
                      className="object-cover"
                    />
                  </div>
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

                {reviewSummary.average !== null && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-sm">
                    <span className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star
                          key={n}
                          size={14}
                          className={n <= Math.round(reviewSummary.average!) ? "fill-amber-400 text-amber-400" : "text-muted/30"}
                        />
                      ))}
                    </span>
                    <span className="font-semibold text-foreground">{reviewSummary.average.toFixed(1)}</span>
                    <span className="text-muted">
                      {t.basedOn} {reviewSummary.count} review{reviewSummary.count === 1 ? "" : "s"}
                    </span>
                  </div>
                )}

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
                        <div key={url} className="relative h-28 w-full overflow-hidden rounded-lg">
                          <Image src={url} alt="" fill sizes="(max-width: 640px) 50vw, 33vw" className="object-cover" />
                        </div>
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
                            <div className="relative h-20 w-full overflow-hidden rounded-lg">
                              <Image src={p.image_urls[0]} alt={p.title} fill sizes="(max-width: 640px) 50vw, 200px" className="object-cover" />
                            </div>
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

                <div className="mt-8 border-t border-border pt-6">
                  <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">{t.reviewsHeading}</p>
                  {reviewSummary.reviews.length === 0 ? (
                    <p className="text-sm text-muted">{t.noReviews}</p>
                  ) : (
                    <div className="flex flex-col gap-4">
                      {reviewSummary.reviews.map((r) => (
                        <div key={r.id} className="border-b border-border pb-4 last:border-b-0 last:pb-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-semibold">{r.reviewer_name}</p>
                            <span className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((n) => (
                                <Star key={n} size={12} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-muted/30"} />
                              ))}
                            </span>
                          </div>
                          {r.comment && <p className="mt-1 text-sm text-muted">{r.comment}</p>}
                          <p className="mt-1 text-xs text-muted/70">{new Date(r.created_at).toLocaleDateString()}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="mt-5">
                    <SupplierReviewForm supplierId={supplier.id} writeReviewLabel={t.writeReview} />
                  </div>
                </div>
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
