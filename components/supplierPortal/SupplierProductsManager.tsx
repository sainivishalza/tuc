"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, PackageX } from "lucide-react";
import { createProduct, updateProduct, deleteProduct } from "@/lib/actions/supplierProducts";
import type { SupplierProduct, SourcingCategory, PriceTier } from "@/lib/supabase/types";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "mb-2 block text-sm font-medium";
const MAX_GALLERY_IMAGES = 6;

function formatPriceRange(tiers: PriceTier[], unit: string | null): string {
  if (tiers.length === 0) return "No price set";
  const low = Math.min(...tiers.map((t) => t.price));
  const high = Math.max(...tiers.map((t) => t.price));
  const range = low === high ? `$${low}` : `$${low}–$${high}`;
  return unit ? `${range} / ${unit}` : range;
}

/** Same remove-then-add-more pattern as the admin/profile GalleryManager —
 * kept as its own copy since this form lives in the public "glass" style
 * system, matching this codebase's existing per-file convention. */
function GalleryManager({ images }: { images: string[] }) {
  const [kept, setKept] = useState<string[]>(images);
  const remainingSlots = Math.max(0, MAX_GALLERY_IMAGES - kept.length);

  return (
    <div>
      <label className={labelClass}>Photos (at least 1, up to {MAX_GALLERY_IMAGES})</label>
      <input type="hidden" name="existing_gallery_urls" value={JSON.stringify(kept)} />
      {kept.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {kept.map((url) => (
            <div key={url} className="group relative h-16 w-full">
              <Image src={url} alt="" fill sizes="96px" className="rounded-lg border border-border object-cover" />
              <button
                type="button"
                onClick={() => setKept((prev) => prev.filter((u) => u !== url))}
                aria-label="Remove photo"
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}
      {remainingSlots > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {Array.from({ length: remainingSlots }).map((_, i) => (
            <input key={i} type="file" name={`gallery_${i}`} accept="image/png,image/jpeg,image/webp" className="text-[11px]" />
          ))}
        </div>
      )}
    </div>
  );
}

function PriceTiersEditor({ initial }: { initial: PriceTier[] }) {
  const [tiers, setTiers] = useState<PriceTier[]>(initial.length > 0 ? initial : [{ min_qty: 1, price: 0 }]);

  function update(i: number, field: keyof PriceTier, value: number) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)));
  }

  return (
    <div>
      <label className={labelClass}>Quantity-break pricing</label>
      <input type="hidden" name="price_tiers" value={JSON.stringify(tiers)} />
      <div className="flex flex-col gap-2">
        {tiers.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="number"
              min={0}
              value={t.min_qty}
              onChange={(e) => update(i, "min_qty", Number(e.target.value))}
              placeholder="Min qty"
              className={`${inputClass} py-2`}
            />
            <span className="text-xs text-muted">units at $</span>
            <input
              type="number"
              min={0}
              step="0.01"
              value={t.price}
              onChange={(e) => update(i, "price", Number(e.target.value))}
              placeholder="Price"
              className={`${inputClass} py-2`}
            />
            <button
              type="button"
              onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={tiers.length === 1}
              className="shrink-0 rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove tier"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setTiers((prev) => [...prev, { min_qty: 0, price: 0 }])}
        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80"
      >
        <Plus size={13} />
        Add a quantity break
      </button>
    </div>
  );
}

function ProductForm({
  product,
  categories,
  onDone,
  onCancel,
}: {
  product: SupplierProduct | null;
  categories: SourcingCategory[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categoryId, setCategoryId] = useState(product?.category_id ?? "");
  const [priceUnit, setPriceUnit] = useState(product?.price_unit ?? "");
  const [moq, setMoq] = useState(product?.moq ?? "");
  const [leadTime, setLeadTime] = useState(product?.lead_time ?? "");
  const [unit, setUnit] = useState(product?.unit ?? "");
  const [customizable, setCustomizable] = useState(product?.customizable ?? false);
  const [customizationNotes, setCustomizationNotes] = useState(product?.customization_notes ?? "");
  const [sampleAvailable, setSampleAvailable] = useState(product?.sample_available ?? false);
  const [samplePrice, setSamplePrice] = useState(product?.sample_price?.toString() ?? "");
  const [portOfShipment, setPortOfShipment] = useState(product?.port_of_shipment ?? "");
  const [status, setStatus] = useState<SupplierProduct["status"]>(product?.status ?? "active");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!formRef.current) return;
    const formData = new FormData(formRef.current);
    const input = {
      title,
      description,
      category_id: categoryId,
      price_unit: priceUnit,
      moq,
      lead_time: leadTime,
      unit,
      customizable,
      customization_notes: customizationNotes,
      sample_available: sampleAvailable,
      sample_price: samplePrice,
      port_of_shipment: portOfShipment,
      status,
    };
    startTransition(async () => {
      const result = product
        ? await updateProduct(product.id, input, formData)
        : await createProduct(input, formData);
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      onDone();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-strong card flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Product title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g. Custom Silicone Phone Case" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Materials, specs, printing/customization options…"
            className={`resize-none ${inputClass}`}
          />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">No category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Unit</label>
          <input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="piece, set, carton, kg…" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>MOQ (minimum order quantity)</label>
          <input value={moq} onChange={(e) => setMoq(e.target.value)} placeholder="e.g. 500 pieces" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Lead time</label>
          <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} placeholder="e.g. 20–30 days" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price unit</label>
          <input value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} placeholder="USD / piece" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Port of shipment</label>
          <input value={portOfShipment} onChange={(e) => setPortOfShipment(e.target.value)} placeholder="e.g. Shenzhen, China" className={inputClass} />
        </div>
      </div>

      <PriceTiersEditor initial={product?.price_tiers ?? []} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} className="h-4 w-4 accent-accent" />
            Customization available
          </label>
          {customizable && (
            <input
              value={customizationNotes}
              onChange={(e) => setCustomizationNotes(e.target.value)}
              placeholder="e.g. logo printing, color options, packaging"
              className={inputClass}
            />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={sampleAvailable} onChange={(e) => setSampleAvailable(e.target.checked)} className="h-4 w-4 accent-accent" />
            Sample available
          </label>
          {sampleAvailable && (
            <input
              type="number"
              min="0"
              step="0.01"
              value={samplePrice}
              onChange={(e) => setSamplePrice(e.target.value)}
              placeholder="Sample price (USD), leave blank if free"
              className={inputClass}
            />
          )}
        </div>
      </div>

      <GalleryManager images={product?.image_urls ?? []} />

      <div>
        <label className={labelClass}>Visibility</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as SupplierProduct["status"])} className={inputClass}>
          <option value="active">Active — visible in the public catalog</option>
          <option value="inactive">Inactive — hidden, kept for later</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending} className="btn-primary">
          {isPending ? "Saving…" : product ? "Save changes" : "Add product"}
        </button>
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function SupplierProductsManager({
  products: initialProducts,
  categories,
}: {
  products: SupplierProduct[];
  categories: SourcingCategory[];
}) {
  const router = useRouter();
  const [products, setProducts] = useState(initialProducts);
  const [editing, setEditing] = useState<SupplierProduct | "new" | null>(null);
  const [isPending, startTransition] = useTransition();

  function refresh() {
    setEditing(null);
    router.refresh();
  }

  function handleDelete(id: string) {
    if (!confirm("Delete this product? This can't be undone.")) return;
    startTransition(async () => {
      await deleteProduct(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    });
  }

  if (editing) {
    return (
      <ProductForm
        product={editing === "new" ? null : editing}
        categories={categories}
        onDone={refresh}
        onCancel={() => setEditing(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted">{products.length} product{products.length === 1 ? "" : "s"} listed</p>
        <button type="button" onClick={() => setEditing("new")} className="btn-primary btn-sm">
          <Plus size={15} />
          Add product
        </button>
      </div>

      {products.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-2xl p-10 text-center text-sm text-muted">
          <PackageX size={28} className="text-muted" />
          No products yet — add your first one to appear in the public catalog.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <div key={p.id} className="glass-strong flex flex-col gap-2 rounded-2xl p-4">
              {p.image_urls[0] ? (
                <div className="relative h-32 w-full overflow-hidden rounded-xl">
                  <Image src={p.image_urls[0]} alt={p.title} fill sizes="300px" className="object-cover" />
                </div>
              ) : (
                <div className="flex h-32 w-full items-center justify-center rounded-xl bg-surface-2 text-muted">
                  <PackageX size={24} />
                </div>
              )}
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{p.title}</p>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.status === "active" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {p.status}
                </span>
              </div>
              <p className="text-xs text-muted">{formatPriceRange(p.price_tiers, p.price_unit)}</p>
              <div className="mt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(p)}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-2 py-1.5 text-xs font-medium transition hover:bg-surface-2"
                >
                  <Pencil size={12} />
                  Edit
                </button>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleDelete(p.id)}
                  className="flex items-center justify-center gap-1.5 rounded-lg border border-red-200 px-2 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
