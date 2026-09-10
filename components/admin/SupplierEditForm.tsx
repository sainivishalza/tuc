"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateSupplier } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

export default function SupplierEditForm({ supplier }: { supplier: Supplier }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [companyName, setCompanyName] = useState(supplier.company_name);
  const [contactName, setContactName] = useState(supplier.contact_name);
  const [email, setEmail] = useState(supplier.email);
  const [phone, setPhone] = useState(supplier.phone ?? "");
  const [productCategories, setProductCategories] = useState(supplier.product_categories ?? "");
  const [businessAddress, setBusinessAddress] = useState(supplier.business_address ?? "");
  const [notes, setNotes] = useState(supplier.notes ?? "");
  const [adminNotes, setAdminNotes] = useState(supplier.admin_notes ?? "");
  const [status, setStatus] = useState<Supplier["status"]>(supplier.status);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const formData = formRef.current ? new FormData(formRef.current) : undefined;
      await updateSupplier(
        supplier.id,
        {
          company_name: companyName,
          contact_name: contactName,
          email,
          phone,
          product_categories: productCategories,
          business_address: businessAddress,
          notes,
          admin_notes: adminNotes,
          status,
        },
        formData
      );
      router.push("/admin/suppliers");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Company Name *</label>
          <input value={companyName} onChange={(e) => setCompanyName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Contact Name *</label>
          <input value={contactName} onChange={(e) => setContactName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Phone / WhatsApp</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Product Categories</label>
          <input value={productCategories} onChange={(e) => setProductCategories(e.target.value)} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Business Address</label>
          <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Notes (from supplier)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className={`resize-none ${inputClass}`} />
      </div>

      <div>
        <label className={labelClass}>Admin Notes (internal only, never shown publicly)</label>
        <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} rows={2} className={`resize-none ${inputClass}`} />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Replace business license</label>
          {supplier.business_license_url && (
            <a href={supplier.business_license_url} target="_blank" rel="noopener noreferrer" className="mb-1 block text-[11px] text-accent underline underline-offset-2">
              View current file
            </a>
          )}
          <input type="file" name="business_license" accept="image/png,image/jpeg,image/webp,application/pdf" className={`${inputClass} py-2 text-xs`} />
        </div>
        <div>
          <label className={labelClass}>Replace visiting card</label>
          {supplier.visiting_card_url && (
            <a href={supplier.visiting_card_url} target="_blank" rel="noopener noreferrer" className="mb-1 block text-[11px] text-accent underline underline-offset-2">
              View current file
            </a>
          )}
          <input type="file" name="visiting_card" accept="image/png,image/jpeg,image/webp" className={`${inputClass} py-2 text-xs`} />
        </div>
        <div>
          <label className={labelClass}>Replace company photo</label>
          {supplier.company_photo_url && (
            <a href={supplier.company_photo_url} target="_blank" rel="noopener noreferrer" className="mb-1 block text-[11px] text-accent underline underline-offset-2">
              View current file
            </a>
          )}
          <input type="file" name="company_photo" accept="image/png,image/jpeg,image/webp" className={`${inputClass} py-2 text-xs`} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as Supplier["status"])} className={inputClass}>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-2 w-fit">
        {submitting ? "Saving..." : "Save changes"}
      </Button>
    </form>
  );
}
