import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Building2, PackageX, MessageCircle, CheckCircle2 } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublicProductById } from "@/lib/actions/supplierProducts";
import { whatsappLink } from "@/lib/whatsapp";
import { localeAlternates } from "@/lib/hreflang";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const product = await getPublicProductById(id);
  return {
    title: product ? `${product.title} — The Unique Choice` : `${dict.products.catalog.title} — The Unique Choice`,
    description: product?.description?.slice(0, 160),
    alternates: localeAlternates(locale, `/products/${id}`),
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const [dict, product] = await Promise.all([getDictionary(locale), getPublicProductById(id)]);
  const t = dict.products.detail;

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-20 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <Link href={`/${locale}/products`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
              <ArrowLeft size={14} />
              {t.backLabel}
            </Link>

            {!product ? (
              <div className="glass-strong rounded-2xl px-6 py-16 text-center text-sm text-muted">{t.notFound}</div>
            ) : (
              <div className="glass-strong rounded-2xl p-6 sm:p-8">
                {product.image_urls.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {product.image_urls.map((url, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={product.title}
                        className={`rounded-xl object-cover ${i === 0 ? "col-span-2 h-56 sm:col-span-2" : "h-28"}`}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center rounded-xl bg-surface-2 text-muted">
                    <PackageX size={32} />
                  </div>
                )}

                <div className="mt-5 flex flex-wrap items-center gap-2 text-xs">
                  {product.category_name && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-500">{product.category_name}</span>
                  )}
                  <Link
                    href={`/${locale}/suppliers/${product.supplier_id}`}
                    className="flex items-center gap-1 text-muted hover:text-foreground"
                  >
                    <Building2 size={12} />
                    {product.supplier_company_name}
                  </Link>
                </div>

                <h1 className="font-display mt-3 text-2xl font-bold sm:text-3xl">{product.title}</h1>
                {product.description && (
                  <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{product.description}</p>
                )}

                {product.price_tiers.length > 0 && (
                  <div className="mt-6 border-t border-border pt-6">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t.priceLabel}</p>
                    <div className="overflow-hidden rounded-xl border border-border">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-surface-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                            <th className="px-4 py-2">{t.quantityColumn}</th>
                            <th className="px-4 py-2">{t.priceColumn}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {product.price_tiers.map((tier, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-4 py-2">≥ {tier.min_qty}</td>
                              <td className="px-4 py-2 font-medium">
                                ${tier.price}
                                {product.price_unit ? ` / ${product.price_unit}` : ""}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-6 sm:grid-cols-3">
                  {product.moq && <Info label={t.moqLabel} value={product.moq} />}
                  {product.lead_time && <Info label={t.leadTimeLabel} value={product.lead_time} />}
                  {product.unit && <Info label={t.unitLabel} value={product.unit} />}
                  {product.port_of_shipment && <Info label={t.portLabel} value={product.port_of_shipment} />}
                </div>

                {(product.customizable || product.sample_available) && (
                  <div className="mt-6 flex flex-col gap-2 border-t border-border pt-6 text-sm">
                    {product.customizable && (
                      <p className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                        <span>
                          <span className="font-medium">{t.customizableLabel}</span>
                          {product.customization_notes ? ` — ${product.customization_notes}` : ""}
                        </span>
                      </p>
                    )}
                    {product.sample_available && (
                      <p className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                        <span>
                          <span className="font-medium">{t.sampleAvailableLabel}</span>
                          {product.sample_price ? ` — $${product.sample_price}` : ""}
                        </span>
                      </p>
                    )}
                  </div>
                )}

                <div className="mt-8 border-t border-border pt-6 text-center">
                  <a
                    href={whatsappLink(`Hi! I'm interested in "${product.title}" from ${product.supplier_company_name}.`)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary"
                  >
                    <MessageCircle size={16} />
                    {t.inquireCta}
                  </a>
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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-sm text-foreground">{value}</p>
    </div>
  );
}
