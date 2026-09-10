"use client";

import { useState } from "react";
import { Mail, CheckCircle } from "lucide-react";
import { subscribe } from "@/lib/actions/newsletter";
import type { Dictionary, Locale } from "@/lib/i18n";
import TurnstileWidget from "./TurnstileWidget";

export default function NewsletterForm({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState("");
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (captchaConfigured && !turnstileToken) {
      setShowCaptcha(true);
      return;
    }

    setSubmitting(true);
    const result = await subscribe({ email, source: "newsletter", locale, turnstileToken });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <p className="mt-4 flex items-center gap-2 text-sm text-white/70">
        <CheckCircle size={16} className="text-brand-blue" />
        {dict.newsletter.success}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-white/40">{dict.newsletter.label}</p>
      <div className="mt-2 flex gap-2">
        <div className="relative flex-1">
          <Mail size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={dict.newsletter.placeholder}
            required
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/30 focus:border-brand-blue focus:outline-none focus:ring-1 focus:ring-brand-blue"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || (captchaConfigured && showCaptcha && !turnstileToken)}
          className="shrink-0 rounded-lg bg-brand-blue px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {submitting ? "..." : dict.newsletter.button}
        </button>
      </div>
      {showCaptcha && (
        <div className="mt-2">
          <TurnstileWidget onVerify={setTurnstileToken} />
        </div>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  );
}
