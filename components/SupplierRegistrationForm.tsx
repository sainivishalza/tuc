"use client";

import { useRef, useState } from "react";
import { CheckCircle, MessageCircle, Send, Upload } from "lucide-react";
import { submitSupplierRegistration } from "@/lib/actions/suppliers";
import { whatsappLink } from "@/lib/whatsapp";
import type { Dictionary } from "@/lib/i18n";
import TurnstileWidget from "./TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function FileField({
  name,
  label,
  hint,
  accept,
}: {
  name: string;
  label: string;
  hint: string;
  accept: string;
}) {
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <label className="mb-2 block text-sm font-medium">{label}</label>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-4 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
      >
        <Upload size={16} />
        {fileName || "Upload a file"}
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

export default function SupplierRegistrationForm({ dict }: { dict: Dictionary }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!formRef.current) return;

    setSubmitting(true);
    const formData = new FormData(formRef.current);
    formData.set("turnstileToken", turnstileToken);
    const result = await submitSupplierRegistration(formData);
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="glass-strong flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
          <CheckCircle size={28} />
        </div>
        <h3 className="font-display text-xl font-semibold">Submitted for review</h3>
        <p className="max-w-sm text-sm text-muted">
          We&apos;ll review your details and documents, and reach out once your listing is approved.
        </p>
        <a
          href={whatsappLink(dict.contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="brand-gradient mt-2 flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
        >
          <MessageCircle size={16} />
          {dict.nav.chatWhatsapp}
        </a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Company Name *</label>
          <input name="company_name" required placeholder="Shenzhen Example Co., Ltd." className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Contact Name *</label>
          <input name="contact_name" required placeholder="Wei Zhang" className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Email *</label>
          <input type="email" name="email" required placeholder="sales@example.com" className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Phone / WhatsApp</label>
          <input name="phone" placeholder="+86 123 4567 8900" className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Product Categories</label>
          <input name="product_categories" placeholder="Electronics, Home & Kitchen" className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Business Address</label>
          <input name="business_address" placeholder="City, Province" className={inputClass} />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">Additional Notes</label>
          <textarea name="notes" rows={3} placeholder="Anything else worth knowing about your business" className={`resize-none ${inputClass}`} />
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FileField
          name="business_license"
          label="Business License"
          hint="Image or PDF, up to 5MB"
          accept="image/png,image/jpeg,image/webp,application/pdf"
        />
        <FileField
          name="visiting_card"
          label="Visiting / Business Card"
          hint="Image, up to 5MB"
          accept="image/png,image/jpeg,image/webp"
        />
        <FileField
          name="company_photo"
          label="Company Photo"
          hint="Storefront, office, or factory — image, up to 5MB"
          accept="image/png,image/jpeg,image/webp"
        />
      </div>

      <div className="mt-6">
        <TurnstileWidget onVerify={setTurnstileToken} />
      </div>

      <button
        type="submit"
        disabled={submitting || (captchaConfigured && !turnstileToken)}
        className="brand-gradient-animated mt-6 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
      >
        <Send size={16} />
        {submitting ? "Submitting..." : "Submit for Review"}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
    </form>
  );
}
