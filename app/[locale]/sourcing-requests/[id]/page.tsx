import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, MapPin, Calendar, Video, Link2 } from "lucide-react";
import { getDictionary, type Locale } from "@/lib/i18n";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getPublicSourcingRequestById } from "@/lib/actions/sourcingRequests";
import { getSupplierEmailIfValid } from "@/lib/supplierAuth";
import { localeAlternates } from "@/lib/hreflang";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const dict = await getDictionary(locale);
  const request = await getPublicSourcingRequestById(id);
  return {
    title: request ? `${request.title} — The Unique Choice` : `${dict.sourcingRequests.board.title} — The Unique Choice`,
    description: request?.description?.slice(0, 160),
    alternates: localeAlternates(locale, `/sourcing-requests/${id}`),
  };
}

export default async function SourcingRequestDetailPage({
  params,
}: {
  params: Promise<{ locale: Locale; id: string }>;
}) {
  const { locale, id } = await params;
  const [dict, request, supplierEmail] = await Promise.all([
    getDictionary(locale),
    getPublicSourcingRequestById(id),
    getSupplierEmailIfValid(),
  ]);
  const t = dict.sourcingRequests.detail;

  const title = locale === "zh" && request?.title_zh ? request.title_zh : locale === "ru" && request?.title_ru ? request.title_ru : request?.title;
  const description =
    locale === "zh" && request?.description_zh
      ? request.description_zh
      : locale === "ru" && request?.description_ru
        ? request.description_ru
        : request?.description;

  return (
    <>
      <Header dict={dict} locale={locale} />
      <main>
        <section className="relative px-4 pt-28 pb-20 sm:px-6">
          <div className="mx-auto max-w-2xl">
            <Link href={`/${locale}/sourcing-requests`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
              <ArrowLeft size={14} />
              {t.backToBoard}
            </Link>

            {!request ? (
              <div className="glass-strong rounded-2xl px-6 py-16 text-center text-sm text-muted">{t.notFound}</div>
            ) : (
              <div className="glass-strong rounded-2xl p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  {request.category_name && <span className="rounded-full bg-gray-100 px-2.5 py-1 font-medium text-gray-500">{request.category_name}</span>}
                  <span className="flex items-center gap-1 text-muted">
                    <Calendar size={12} />
                    {t.postedOn} {new Date(request.created_at).toLocaleDateString()}
                  </span>
                  {request.destination_country && (
                    <span className="flex items-center gap-1 text-muted">
                      <MapPin size={12} />
                      {request.destination_country}
                    </span>
                  )}
                </div>

                <h1 className="font-display mt-4 text-2xl font-bold sm:text-3xl">{title}</h1>
                <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-muted">{description}</p>

                <div className="mt-6 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-3">
                  {request.quantity && <Info label={dict.sourcingRequests.form.quantityLabel} value={request.quantity} />}
                  {request.budget_range && <Info label={dict.sourcingRequests.form.budgetLabel} value={request.budget_range} />}
                  {request.timeline && <Info label={dict.sourcingRequests.form.timelineLabel} value={request.timeline} />}
                </div>

                {request.image_urls.length > 0 && (
                  <div className="mt-6 grid grid-cols-3 gap-3">
                    {request.image_urls.map((url) => (
                      <div key={url} className="relative aspect-square overflow-hidden rounded-xl border border-border">
                        {/* eslint-disable-next-line @next/next/no-img-element -- Supabase-hosted upload, same convention as other user-submitted images in this codebase */}
                        <img src={url} alt="" className="h-full w-full object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {(request.video_url || request.social_link) && (
                  <div className="mt-6 flex flex-wrap gap-4 border-t border-border pt-6 text-sm">
                    {request.video_url && (
                      <a href={request.video_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:opacity-80">
                        <Video size={14} />
                        Video reference
                      </a>
                    )}
                    {request.social_link && (
                      <a href={request.social_link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-accent hover:opacity-80">
                        <Link2 size={14} />
                        Social / website
                      </a>
                    )}
                  </div>
                )}

                <div className="mt-8 border-t border-border pt-6 text-center">
                  {supplierEmail ? (
                    <Link href="/supplier-portal/requirements" className="btn-primary">
                      View in your supplier dashboard
                    </Link>
                  ) : (
                    <Link href="/supplier-portal/login" className="btn-primary">
                      {t.signInCta}
                    </Link>
                  )}
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
