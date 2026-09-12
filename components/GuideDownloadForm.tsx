"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { subscribe } from "@/lib/actions/newsletter";
import { getGuidePdfUrl } from "@/lib/guide";
import type { Locale } from "@/lib/i18n";
import TurnstileWidget from "./TurnstileWidget";

export default function GuideDownloadForm({ locale }: { locale: Locale }) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const result = await subscribe({ email, source: "guide_download", locale, turnstileToken });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setUnlocked(true);
  }

  if (unlocked) {
    return (
      <div className="glass-strong flex flex-col items-center gap-4 rounded-2xl px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent">
          <FileText size={28} />
        </div>
        <h3 className="font-display text-xl font-semibold">Your guide is ready</h3>
        <a
          href={getGuidePdfUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary mt-2"
        >
          <Download size={16} />
          Download the PDF
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="glass-strong rounded-2xl p-6 sm:p-8">
      <div>
        <label className="mb-2 block text-sm font-medium">Email Address *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </div>
      <div className="mt-4">
        <TurnstileWidget onVerify={setTurnstileToken} />
      </div>
      <button
        type="submit"
        disabled={submitting || (captchaConfigured && !turnstileToken)}
        className="btn-primary mt-6 w-full"
      >
        <Download size={16} />
        {submitting ? "..." : "Get the Free Guide"}
      </button>
      {error && <p className="mt-4 text-center text-sm text-red-500">{error}</p>}
    </form>
  );
}
