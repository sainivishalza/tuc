"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Upload } from "lucide-react";
import { updateOwnSupplierProfile } from "@/lib/actions/supplierPortal";
import type { Supplier } from "@/lib/supabase/types";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";
const labelClass = "mb-2 block text-sm font-medium";

function FileField({
  name,
  label,
  hint,
  accept,
  currentUrl,
}: {
  name: string;
  label: string;
  hint: string;
  accept: string;
  currentUrl: string | null;
}) {
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className={labelClass}>{label}</label>
      {currentUrl && (
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mb-2 block text-[11px] text-accent underline underline-offset-2"
        >
          View current file
        </a>
      )}
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-4 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
      >
        <Upload size={16} />
        {fileName || "Replace file"}
      </button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
      <p className="mt-1 text-[11px] text-muted">{hint}</p>
    </div>
  );
}

export default function SupplierProfileForm({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [companyName, setCompanyName] = useState(supplier.company_name);
  const [contactName, setContactName] = useState(supplier.contact_name);
  const [phone, setPhone] = useState(supplier.phone ?? "");
  const [productCategories, setProductCategories] = useState(supplier.product_categories ?? "");
  const [businessAddress, setBusinessAddress] = useState(supplier.business_address ?? "");
  const [country, setCountry] = useState(supplier.country ?? "");
  const [notes, setNotes] = useState(supplier.notes ?? "");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSubmitting(true);
    const formData = formRef.current ? new FormData(formRef.current) : undefined;
    const result = await updateOwnSupplierProfile(
      supplier.email,
      {
        company_name: companyName,
        contact_name: contactName,
        phone,
        product_categories: productCategories,
        business_address: businessAddress,
        country,
        notes,
      },
      formData
    );
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company Name *</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact Name *</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email</label>
          <input value={supplier.email} disabled className={`${inputClass} cursor-not-allowed opacity-60`} />
        </div>
        <div>
          <label className={labelClass}>Phone / WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Product Categories</label>
          <input
            value={productCategories}
            onChange={(e) => setProductCategories(e.target.value)}
            placeholder="Electronics, Home & Kitchen"
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>Business Address</label>
          <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Country</label>
          <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="China" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className={labelClass}>Additional Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything else worth knowing about your business"
            className={`resize-none ${inputClass}`}
          />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FileField
          name="business_license"
          label="Business License"
          hint="Image or PDF, up to 5MB"
          accept="image/png,image/jpeg,image/webp,application/pdf"
          currentUrl={supplier.business_license_url}
        />
        <FileField
          name="visiting_card"
          label="Visiting / Business Card"
          hint="Image, up to 5MB"
          accept="image/png,image/jpeg,image/webp"
          currentUrl={supplier.visiting_card_url}
        />
        <FileField
          name="company_photo"
          label="Company Photo"
          hint="Storefront, office, or factory — image, up to 5MB"
          accept="image/png,image/jpeg,image/webp"
          currentUrl={supplier.company_photo_url}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-500">{error}</p>}
      {saved && (
        <p className="mt-4 flex items-center gap-2 text-sm text-emerald-600">
          <CheckCircle size={15} />
          Saved.
        </p>
      )}

      <button type="submit" disabled={submitting} className="btn-primary mt-6">
        {submitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
