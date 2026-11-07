"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, PackageX, Building2 } from "lucide-react";
import type { PublicSupplierProduct, SourcingCategory } from "@/lib/supabase/types";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

function lowestPrice(product: PublicSupplierProduct): number | null {
  if (product.price_tiers.length === 0) return null;
  return Math.min(...product.price_tiers.map((t) => t.price));
}

function formatPrice(product: PublicSupplierProduct, fromLabel: string): string {
  const low = lowestPrice(product);
  if (low === null) return "";
  return `${fromLabel} $${low}${product.price_unit ? ` / ${product.price_unit}` : ""}`;
}

export default function ProductsCatalogBoard({
  dict,
  locale,
  products,
  categories,
}: {
  dict: Dictionary;
  locale: Locale;
  products: PublicSupplierProduct[];
  categories: SourcingCategory[];
}) {
  const t = dict.products.catalog;
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [priceMax, setPriceMax] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const max = priceMax.trim() ? Number(priceMax) : null;
    return products.filter((p) => {
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
      if (max !== null) {
        const low = lowestPrice(p);
        if (low === null || low > max) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, priceMax]);

  return (
    <div>
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 pl-9 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">{t.filterAllCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="number"
          min="0"
          value={priceMax}
          onChange={(e) => setPriceMax(e.target.value)}
          placeholder={t.maxPricePlaceholder}
          className="w-36 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center text-sm text-muted">
          <PackageX size={28} />
          {t.emptyState}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              href={`/${locale}/products/${p.id}`}
              className="glass-strong card group flex flex-col gap-3 transition hover:border-accent/40"
            >
              {p.image_urls[0] ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_urls[0]} alt={p.title} className="h-40 w-full rounded-xl object-cover" />
              ) : (
                <div className="flex h-40 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <PackageX size={28} />
                </div>
              )}
              {p.category_name && (
                <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">{p.category_name}</span>
              )}
              <h3 className="font-display line-clamp-2 text-base font-semibold leading-snug">{p.title}</h3>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Building2 size={12} />
                {p.supplier_company_name}
              </p>
              <p className="mt-auto border-t border-border pt-3 text-sm font-semibold text-accent">{formatPrice(p, t.fromLabel)}</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
