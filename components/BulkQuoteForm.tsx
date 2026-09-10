"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { CheckCircle, MessageCircle, Send, Trash2, Upload } from "lucide-react";
import { parseCsv } from "@/lib/csv";
import { submitBulkQuoteRequest } from "@/lib/actions/quoteRequests";
import { trackCtaClick } from "@/lib/analytics";
import { whatsappLink } from "@/lib/whatsapp";
import type { QuoteLineItem } from "@/lib/supabase/types";
import type { Dictionary } from "@/lib/i18n";
import TurnstileWidget from "./TurnstileWidget";

const timelines = [
  { id: "asap", label: "ASAP" },
  { id: "1month", label: "Within 1 month" },
  { id: "3months", label: "Within 3 months" },
  { id: "exploring", label: "Just exploring" },
];

const TEMPLATE_CSV =
  "product,quantity,notes\n" +
  "Waterproof LED strip lights,2000 pcs,CE certified\n" +
  "Stainless steel water bottles,1000 pcs,Custom logo laser-engraved\n";

function emptyRow(): QuoteLineItem {
  return { product: "", quantity: "", notes: "" };
}

export default function BulkQuoteForm({ dict }: { dict: Dictionary }) {
  const [items, setItems] = useState<QuoteLineItem[]>([emptyRow()]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [timeline, setTimeline] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pathname = usePathname() ?? "/";
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  function handleFile(file: File) {
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCsv(text);
      if (rows.length === 0) return;

      const looksLikeHeader = /product/i.test(rows[0][0] ?? "");
      const dataRows = looksLikeHeader ? rows.slice(1) : rows;

      const parsed: QuoteLineItem[] = dataRows
        .map((r) => ({
          product: (r[0] ?? "").trim(),
          quantity: (r[1] ?? "").trim(),
          notes: (r[2] ?? "").trim(),
        }))
        .filter((r) => r.product !== "");

      if (parsed.length > 0) setItems(parsed);
    };
    reader.readAsText(file);
  }

  function updateItem(index: number, field: keyof QuoteLineItem, value: string) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addRow() {
    setItems((prev) => [...prev, emptyRow()]);
  }

  async function handleSubmit() {
    setError("");
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    const validItems = items.filter((item) => item.product.trim() !== "");
    if (validItems.length === 0) {
      setError("Add at least one line item with a product.");
      return;
    }

    setSubmitting(true);
    const result = await submitBulkQuoteRequest({
      name,
      email,
      whatsapp,
      timeline,
      message,
      items: validItems,
      turnstileToken,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    trackCtaClick("Bulk Quote Submit", pathname);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="glass-strong flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/15 text-green-500">
          <CheckCircle size={28} />
        </div>
        <h3 className="font-display text-xl font-semibold">
          {dict.consultation.form.success}
        </h3>
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
    <div className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-semibold">Line items</h3>
          <p className="text-sm text-muted">
            Upload a CSV, or add rows manually below.
          </p>
        </div>
        <a
          href={`data:text/csv;charset=utf-8,${encodeURIComponent(TEMPLATE_CSV)}`}
          download="bulk-quote-template.csv"
          className="text-sm font-medium text-accent underline decoration-accent/40 underline-offset-4 hover:opacity-80"
        >
          Download CSV template
        </a>
      </div>

      <div className="mt-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border px-4 py-4 text-sm font-medium text-muted transition hover:border-accent/50 hover:text-foreground"
        >
          <Upload size={16} />
          {fileName || "Upload a CSV file"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-1 gap-2 sm:grid-cols-[2fr_1fr_2fr_auto]">
            <input
              value={item.product}
              onChange={(e) => updateItem(i, "product", e.target.value)}
              placeholder="Product"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={item.quantity}
              onChange={(e) => updateItem(i, "quantity", e.target.value)}
              placeholder="Quantity"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <input
              value={item.notes}
              onChange={(e) => updateItem(i, "notes", e.target.value)}
              placeholder="Notes (certifications, spec, etc.)"
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              disabled={items.length === 1}
              className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-muted transition hover:border-red-300 hover:text-red-500 disabled:opacity-30"
              aria-label="Remove row"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={addRow}
          className="mt-1 w-fit text-sm font-medium text-accent hover:opacity-80"
        >
          + Add another row
        </button>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium">Your Name *</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Smith"
            required
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="john@company.com"
            required
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">WhatsApp Number</label>
          <input
            type="tel"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+1 234 567 8900"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
        <div>
          <label className="mb-2 block text-sm font-medium">Timeline</label>
          <select
            value={timeline}
            onChange={(e) => setTimeline(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">Select a timeline</option>
            {timelines.map((t) => (
              <option key={t.id} value={t.id}>{t.label}</option>
            ))}
          </select>
        </div>
        <div className="sm:col-span-2">
          <label className="mb-2 block text-sm font-medium">Additional Details</label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Any shared requirements across these products..."
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div className="mt-4">
        <TurnstileWidget onVerify={setTurnstileToken} />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={submitting || (captchaConfigured && !turnstileToken)}
          className="brand-gradient-animated flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
        >
          <Send size={16} />
          {submitting ? "Sending..." : "Submit Bulk Request"}
        </button>
      </div>

      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
    </div>
  );
}
