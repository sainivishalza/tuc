"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Package, Wrench, Boxes, MapPin, Calendar } from "lucide-react";
import type { PublicSourcingRequest, SourcingCategory, SourcingRequestType } from "@/lib/supabase/types";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const TYPE_ICON: Record<SourcingRequestType, typeof Package> = {
  product: Package,
  service: Wrench,
  other: Boxes,
};

export default function SourcingRequestsBoard({
  dict,
  locale,
  requests,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  requests: PublicSourcingRequest[];
  categories: SourcingCategory[];
}) {
  const t = dict.sourcingRequests.board;
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<SourcingRequestType | "">("");

  const filtered = useMemo(
    () =>
      requests.filter((r) => {
        if (categoryFilter && r.category_id !== categoryFilter) return false;
        if (typeFilter && r.type !== typeFilter) return false;
        return true;
      }),
    [requests, categoryFilter, typeFilter]
  );

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">{t.filterAll}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as SourcingRequestType | "")}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">{t.typeProduct} / {t.typeService} / {t.typeOther}</option>
          <option value="product">{t.typeProduct}</option>
          <option value="service">{t.typeService}</option>
          <option value="other">{t.typeOther}</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-strong rounded-2xl px-6 py-16 text-center text-sm text-muted">{t.emptyState}</div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((r) => {
            const Icon = TYPE_ICON[r.type];
            const title = locale === "zh" && r.title_zh ? r.title_zh : locale === "ru" && r.title_ru ? r.title_ru : r.title;
            const description =
              locale === "zh" && r.description_zh ? r.description_zh : locale === "ru" && r.description_ru ? r.description_ru : r.description;
            return (
              <Link
                key={r.id}
                href={`/${locale}/sourcing-requests/${r.id}`}
                className="glass-strong card group flex flex-col gap-3 transition hover:border-accent/40"
              >
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand-900">
                    <Icon size={16} />
                  </span>
                  {r.category_name && (
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">{r.category_name}</span>
                  )}
                </div>
                <h3 className="font-display text-base font-semibold leading-snug">{title}</h3>
                <p className="line-clamp-2 text-sm text-muted">{description}</p>
                <div className="mt-auto flex flex-wrap items-center gap-3 border-t border-border pt-3 text-xs text-muted">
                  {r.destination_country && (
                    <span className="flex items-center gap-1">
                      <MapPin size={12} />
                      {r.destination_country}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
