"use client";

import { useRef, useState } from "react";
import { CheckCircle, MessageCircle, Send, Upload } from "lucide-react";
import { submitSourcingRequest } from "@/lib/actions/sourcingRequests";
import { whatsappLink } from "@/lib/whatsapp";
import type { Dictionary } from "@/lib/i18n";
import type { SourcingCategory, SourcingRequestType } from "@/lib/supabase/types";
import TurnstileWidget from "./TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

function FileField({ name, label }: { name: string; label: string }) {
  const [fileName, setFileName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-3 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
      >
        <Upload size={14} />
        {fileName || label}
      </button>
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
      />
    </div>
  );
}

export default function SourcingRequestForm({
  dict,
  categories,
}: {
  dict: Dictionary;
  categories: SourcingCategory[];
}) {
  const t = dict.sourcingRequests.form;
  const typeLabels = dict.sourcingRequests.board;
  const formRef = useRef<HTMLFormElement>(null);
  const [type, setType] = useState<SourcingRequestType>("product");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!formRef.current) return;

    const formData = new FormData(formRef.current);
    formData.set("turnstileToken", turnstileToken);

    setSubmitting(true);
    const result = await submitSourcingRequest(
      {
        title: String(formData.get("title") ?? ""),
        description: String(formData.get("description") ?? ""),
        type,
        category_id: String(formData.get("category_id") ?? ""),
        quantity: String(formData.get("quantity") ?? ""),
        budget_range: String(formData.get("budget_range") ?? ""),
        timeline: String(formData.get("timeline") ?? ""),
        destination_country: String(formData.get("destination_country") ?? ""),
        customer_name: String(formData.get("customer_name") ?? ""),
        customer_email: String(formData.get("customer_email") ?? ""),
        customer_whatsapp: String(formData.get("customer_whatsapp") ?? ""),
        video_url: String(formData.get("video_url") ?? ""),
        social_link: String(formData.get("social_link") ?? ""),
      },
      formData
    );
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
        <h3 className="font-display text-xl font-semibold">{t.submittedTitle}</h3>
        <p className="max-w-sm text-sm text-muted">{t.submittedBody}</p>
        <a
          href={whatsappLink(dict.contact.whatsappMessage)}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-2"
        >
          <MessageCircle size={16} />
          {dict.nav.chatWhatsapp}
        </a>
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="grid grid-cols-1 gap-4">
        <div>
          <label className="mb-2 block text-sm font-medium">{t.titleLabel} *</label>
          <input name="title" required placeholder={t.titlePlaceholder} className={inputClass} />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">{t.descriptionLabel} *</label>
          <textarea name="description" required rows={4} placeholder={t.descriptionPlaceholder} className={`resize-none ${inputClass}`} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">{t.typeLabel}</label>
            <div className="flex gap-2">
              {(["product", "service", "other"] as SourcingRequestType[]).map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setType(opt)}
                  className={`rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
                    type === opt ? "border-accent bg-accent/10 text-accent" : "border-border text-muted hover:text-foreground"
                  }`}
                >
                  {opt === "product" ? typeLabels.typeProduct : opt === "service" ? typeLabels.typeService : typeLabels.typeOther}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.categoryLabel}</label>
            <select name="category_id" className={inputClass} defaultValue="">
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">{t.quantityLabel}</label>
            <input name="quantity" placeholder="e.g. 5,000 units" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.budgetLabel}</label>
            <input name="budget_range" placeholder="e.g. $2-3/unit" className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.timelineLabel}</label>
            <input name="timeline" placeholder="e.g. Within 6 weeks" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t.destinationLabel}</label>
          <input name="destination_country" placeholder="e.g. United States" className={inputClass} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className="mb-2 block text-sm font-medium">{t.nameLabel} *</label>
            <input name="customer_name" required className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.emailLabel} *</label>
            <input type="email" name="customer_email" required className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.whatsappLabel}</label>
            <input name="customer_whatsapp" className={inputClass} />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium">{t.imagesLabel}</label>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FileField name="image_0" label="Photo 1" />
            <FileField name="image_1" label="Photo 2" />
            <FileField name="image_2" label="Photo 3" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium">{t.videoLabel}</label>
            <input type="url" name="video_url" placeholder="https://..." className={inputClass} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium">{t.socialLabel}</label>
            <input type="url" name="social_link" placeholder="https://..." className={inputClass} />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <TurnstileWidget onVerify={setTurnstileToken} />
      </div>

      <button type="submit" disabled={submitting || (captchaConfigured && !turnstileToken)} className="btn-primary mt-6 w-full">
        <Send size={16} />
        {submitting ? t.submitting : t.submit}
      </button>

      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
    </form>
  );
}
