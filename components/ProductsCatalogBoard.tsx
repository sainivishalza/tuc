"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { Search, PackageX, Building2, Heart, Scale, X } from "lucide-react";
import type { PublicSupplierProduct, SourcingCategory } from "@/lib/supabase/types";
import StockStatusBadge from "@/components/StockStatusBadge";
import SaveProductButton from "@/components/SaveProductButton";
import { useSavedProducts } from "@/lib/savedProducts";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

const MAX_COMPARE = 4;

function lowestPrice(product: PublicSupplierProduct): number | null {
  if (product.price_tiers.length === 0) return null;
  return Math.min(...product.price_tiers.map((t) => t.price));
}

function formatPrice(product: PublicSupplierProduct, fromLabel: string): string {
  const low = lowestPrice(product);
  if (low === null) return "";
  return `${fromLabel} $${low}${product.price_unit ? ` / ${product.price_unit}` : ""}`;
}

/** Side-by-side table for the 2-4 products the visitor picked to compare —
 * built entirely from the products already in hand client-side, no extra
 * fetch or dedicated route, since the catalog board already has every
 * product's full data. */
function CompareTable({
  products,
  t,
  locale,
  onRemove,
}: {
  products: PublicSupplierProduct[];
  t: Dictionary["products"]["catalog"];
  locale: Locale;
  onRemove: (id: string) => void;
}) {
  const rows: { label: string; render: (p: PublicSupplierProduct) => ReactNode }[] = [
    { label: t.compareSupplier, render: (p) => p.supplier_company_name },
    { label: t.compareCategory, render: (p) => p.category_name ?? "—" },
    { label: t.comparePrice, render: (p) => formatPrice(p, t.fromLabel) || "—" },
    { label: t.compareMoq, render: (p) => p.moq ?? "—" },
    { label: t.compareLeadTime, render: (p) => p.lead_time ?? "—" },
    { label: t.compareStock, render: (p) => <StockStatusBadge status={p.stock_status} /> },
    { label: t.compareCustomizable, render: (p) => (p.customizable ? "✓" : "—") },
    { label: t.compareSampleAvailable, render: (p) => (p.sample_available ? "✓" : "—") },
  ];

  return (
    <div className="glass-strong mb-8 overflow-x-auto rounded-2xl p-4 sm:p-6">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr>
            <th className="w-28" />
            {products.map((p) => (
              <th key={p.id} className="px-3 pb-3 text-left align-top">
                <button
                  type="button"
                  onClick={() => onRemove(p.id)}
                  aria-label={t.compareRemove}
                  className="mb-2 flex h-6 w-6 items-center justify-center rounded-full border border-border text-muted hover:text-foreground"
                >
                  <X size={12} />
                </button>
                {p.image_urls[0] ? (
                  <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg">
                    <Image src={p.image_urls[0]} alt={p.title} fill sizes="140px" className="object-cover" />
                  </div>
                ) : (
                  <div className="mb-2 flex h-20 w-full items-center justify-center rounded-lg bg-surface-2 text-muted">
                    <PackageX size={18} />
                  </div>
                )}
                <Link href={`/${locale}/products/${p.id}`} className="font-display line-clamp-2 text-sm font-semibold hover:text-accent">
                  {p.title}
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-t border-border">
              <td className="py-2.5 pr-3 text-xs font-semibold uppercase tracking-wide text-muted">{row.label}</td>
              {products.map((p) => (
                <td key={p.id} className="px-3 py-2.5">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
  const [inStockOnly, setInStockOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const { savedIds } = useSavedProducts();
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= MAX_COMPARE) return prev;
      return [...prev, id];
    });
  }

  function removeFromCompare(id: string) {
    setCompareIds((prev) => prev.filter((i) => i !== id));
  }

  const compareProducts = useMemo(
    () => compareIds.map((id) => products.find((p) => p.id === id)).filter((p): p is PublicSupplierProduct => !!p),
    [compareIds, products]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const max = priceMax.trim() ? Number(priceMax) : null;
    return products.filter((p) => {
      if (categoryFilter && p.category_id !== categoryFilter) return false;
      if (q && !p.title.toLowerCase().includes(q) && !(p.description ?? "").toLowerCase().includes(q)) return false;
      if (inStockOnly && p.stock_status !== "in_stock") return false;
      if (savedOnly && !savedIds.has(p.id)) return false;
      if (max !== null) {
        const low = lowestPrice(p);
        if (low === null || low > max) return false;
      }
      return true;
    });
  }, [products, search, categoryFilter, priceMax, inStockOnly, savedOnly, savedIds]);

  return (
    <div className={compareIds.length > 0 ? "pb-16" : ""}>
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
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={(e) => setInStockOnly(e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          {t.inStockOnly}
        </label>
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground">
          <input
            type="checkbox"
            checked={savedOnly}
            onChange={(e) => setSavedOnly(e.target.checked)}
            className="h-4 w-4 rounded accent-accent"
          />
          <Heart size={13} className={savedOnly ? "fill-current text-accent" : ""} />
          {t.savedOnly}
        </label>
      </div>

      {showCompare && compareProducts.length >= 2 && (
        <CompareTable products={compareProducts} t={t} locale={locale} onRemove={removeFromCompare} />
      )}

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
                <div className="relative h-40 w-full overflow-hidden rounded-xl">
                  <Image src={p.image_urls[0]} alt={p.title} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="object-cover" />
                  <div className="absolute right-2 top-2">
                    <SaveProductButton productId={p.id} saveLabel={t.saveLabel} savedLabel={t.savedLabel} />
                  </div>
                </div>
              ) : (
                <div className="relative flex h-40 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <PackageX size={28} />
                  <div className="absolute right-2 top-2">
                    <SaveProductButton productId={p.id} saveLabel={t.saveLabel} savedLabel={t.savedLabel} />
                  </div>
                </div>
              )}
              <div className="flex flex-wrap items-center gap-1.5">
                {p.category_name && (
                  <span className="w-fit rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">{p.category_name}</span>
                )}
                <StockStatusBadge status={p.stock_status} />
              </div>
              <h3 className="font-display line-clamp-2 text-base font-semibold leading-snug">{p.title}</h3>
              <p className="flex items-center gap-1.5 text-xs text-muted">
                <Building2 size={12} />
                {p.supplier_company_name}
              </p>
              <p className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3">
                <span className="text-sm font-semibold text-accent">{formatPrice(p, t.fromLabel)}</span>
                <label
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1.5 text-[11px] font-medium text-muted"
                >
                  <input
                    type="checkbox"
                    checked={compareIds.includes(p.id)}
                    onChange={(e) => {
                      e.preventDefault();
                      toggleCompare(p.id);
                    }}
                    disabled={!compareIds.includes(p.id) && compareIds.length >= MAX_COMPARE}
                    className="h-3.5 w-3.5 rounded accent-accent"
                  />
                  {t.compareLabel}
                </label>
              </p>
            </Link>
          ))}
        </div>
      )}

      {compareIds.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] backdrop-blur sm:px-6">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Scale size={15} />
              {t.compareBarText.replace("{n}", String(compareIds.length))}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCompareIds([])}
                className="text-xs font-medium text-muted hover:text-foreground"
              >
                {t.compareClear}
              </button>
              <button
                type="button"
                onClick={() => setShowCompare(true)}
                disabled={compareIds.length < 2}
                className="btn-primary px-4 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t.compareNowCta}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
