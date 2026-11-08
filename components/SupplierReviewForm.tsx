"use client";

import { useRef, useState } from "react";
import { Star, CheckCircle, Send } from "lucide-react";
import { submitSupplierReview } from "@/lib/actions/supplierReviews";
import TurnstileWidget from "./TurnstileWidget";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

export default function SupplierReviewForm({
  supplierId,
  writeReviewLabel,
}: {
  supplierId: string;
  writeReviewLabel: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const captchaConfigured = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!formRef.current) return;
    if (rating === 0) {
      setError("Pick a star rating.");
      return;
    }

    const formData = new FormData(formRef.current);
    setSubmitting(true);
    const result = await submitSupplierReview({
      supplierId,
      reviewerName: String(formData.get("reviewer_name") ?? ""),
      reviewerEmail: String(formData.get("reviewer_email") ?? ""),
      rating,
      comment: String(formData.get("comment") ?? ""),
      turnstileToken,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-2 px-4 py-3 text-sm text-muted">
        <CheckCircle size={16} className="shrink-0 text-accent" />
        Thanks — your review is in for moderation and will appear here once approved.
      </div>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold">{writeReviewLabel}</p>
      <div className="flex items-center gap-1" onMouseLeave={() => setHoverRating(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            aria-label={`${n} star${n === 1 ? "" : "s"}`}
          >
            <Star
              size={22}
              className={(hoverRating || rating) >= n ? "fill-amber-400 text-amber-400" : "text-muted/40"}
            />
          </button>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input name="reviewer_name" required placeholder="Your name" className={inputClass} />
        <input type="email" name="reviewer_email" required placeholder="Your email" className={inputClass} />
      </div>
      <textarea
        name="comment"
        rows={3}
        placeholder="What was it like working with them? (optional)"
        className={`resize-none ${inputClass}`}
      />
      <TurnstileWidget onVerify={setTurnstileToken} />
      <button
        type="submit"
        disabled={submitting || (captchaConfigured && !turnstileToken)}
        className="btn-primary w-fit"
      >
        <Send size={14} />
        {submitting ? "Submitting..." : "Submit review"}
      </button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
