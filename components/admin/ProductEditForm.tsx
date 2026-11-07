"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Plus, X } from "lucide-react";
import { adminUpdateProduct, adminDeleteProduct, type AdminSupplierProduct } from "@/lib/actions/supplierProducts";
import type { SourcingCategory, PriceTier, SupplierProduct } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const MAX_GALLERY_IMAGES = 6;

/** Same keep/remove/add-slots pattern as SupplierEditForm.tsx's own
 * GalleryManager — kept as its own copy per this codebase's existing
 * per-file convention rather than shared across files. */
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
              <Image src={url} alt="" fill sizes="96px" className="rounded-lg border border-gray-200 object-cover" />
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
            <input type="number" min={0} value={t.min_qty} onChange={(e) => update(i, "min_qty", Number(e.target.value))} placeholder="Min qty" className={`${inputClass} py-2`} />
            <span className="text-xs text-gray-400">units at $</span>
            <input type="number" min={0} step="0.01" value={t.price} onChange={(e) => update(i, "price", Number(e.target.value))} placeholder="Price" className={`${inputClass} py-2`} />
            <button
              type="button"
              onClick={() => setTiers((prev) => prev.filter((_, idx) => idx !== i))}
              disabled={tiers.length === 1}
              className="shrink-0 rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Remove tier"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => setTiers((prev) => [...prev, { min_qty: 0, price: 0 }])} className="mt-2 flex items-center gap-1.5 text-xs font-medium text-accent hover:opacity-80">
        <Plus size={13} />
        Add a quantity break
      </button>
    </div>
  );
}

export default function ProductEditForm({ product, categories }: { product: AdminSupplierProduct; categories: SourcingCategory[] }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description ?? "");
  const [categoryId, setCategoryId] = useState(product.category_id ?? "");
  const [priceUnit, setPriceUnit] = useState(product.price_unit ?? "");
  const [moq, setMoq] = useState(product.moq ?? "");
  const [leadTime, setLeadTime] = useState(product.lead_time ?? "");
  const [unit, setUnit] = useState(product.unit ?? "");
  const [customizable, setCustomizable] = useState(product.customizable);
  const [customizationNotes, setCustomizationNotes] = useState(product.customization_notes ?? "");
  const [sampleAvailable, setSampleAvailable] = useState(product.sample_available);
  const [samplePrice, setSamplePrice] = useState(product.sample_price?.toString() ?? "");
  const [portOfShipment, setPortOfShipment] = useState(product.port_of_shipment ?? "");
  const [status, setStatus] = useState<SupplierProduct["status"]>(product.status);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formData = formRef.current ? new FormData(formRef.current) : new FormData();
      await adminUpdateProduct(product.id, {
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
      }, formData);
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  function handleDelete() {
    if (!confirm(`Delete "${product.title}"? This can't be undone.`)) return;
    startTransition(async () => {
      await adminDeleteProduct(product.id);
      router.push("/admin/products");
      router.refresh();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-gray-500">
        Supplier: <span className="font-medium text-gray-900">{product.supplier_company_name}</span>
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className={labelClass}>Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={`resize-none ${inputClass}`} />
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
          <label className={labelClass}>MOQ</label>
          <input value={moq} onChange={(e) => setMoq(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Lead time</label>
          <input value={leadTime} onChange={(e) => setLeadTime(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Price unit</label>
          <input value={priceUnit} onChange={(e) => setPriceUnit(e.target.value)} placeholder="USD / piece" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Port of shipment</label>
          <input value={portOfShipment} onChange={(e) => setPortOfShipment(e.target.value)} className={inputClass} />
        </div>
      </div>

      <PriceTiersEditor initial={product.price_tiers} />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={customizable} onChange={(e) => setCustomizable(e.target.checked)} className="h-4 w-4 accent-accent" />
            Customization available
          </label>
          {customizable && <input value={customizationNotes} onChange={(e) => setCustomizationNotes(e.target.value)} className={inputClass} />}
        </div>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" checked={sampleAvailable} onChange={(e) => setSampleAvailable(e.target.checked)} className="h-4 w-4 accent-accent" />
            Sample available
          </label>
          {sampleAvailable && (
            <input type="number" min="0" step="0.01" value={samplePrice} onChange={(e) => setSamplePrice(e.target.value)} placeholder="Sample price (USD)" className={inputClass} />
          )}
        </div>
      </div>

      <GalleryManager images={product.image_urls} />

      <div>
        <label className={labelClass}>Visibility</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as SupplierProduct["status"])} className={inputClass}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={submitting} className="w-fit">
          {submitting ? "Saving..." : "Save changes"}
        </Button>
        <Button type="button" variant="danger" disabled={isPending} onClick={handleDelete} className="w-fit">
          {isPending ? "Deleting..." : "Delete product"}
        </Button>
      </div>
    </form>
  );
}
