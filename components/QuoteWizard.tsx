"use client";

import { useState } from "react";
import {
  Send,
  CheckCircle,
  MessageCircle,
  ArrowRight,
  ArrowLeft,
  Package,
  User,
} from "lucide-react";
import type { Dictionary } from "@/lib/i18n";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { whatsappLink } from "@/lib/whatsapp";
import { trackCtaClick } from "@/lib/analytics";
import { submitQuoteRequest } from "@/lib/actions/quoteRequests";
import { usePathname } from "next/navigation";

const productCategories = [
  { id: "electronics", label: "Electronics", emoji: "⚡" },
  { id: "home", label: "Home & Kitchen", emoji: "🏠" },
  { id: "fashion", label: "Fashion", emoji: "👔" },
  { id: "building", label: "Building", emoji: "🏗️" },
  { id: "packaging", label: "Packaging", emoji: "📦" },
  { id: "auto", label: "Auto Parts", emoji: "🔧" },
  { id: "other", label: "Other", emoji: "✨" },
];

const timelines = [
  { id: "asap", label: "ASAP" },
  { id: "1month", label: "Within 1 month" },
  { id: "3months", label: "Within 3 months" },
  { id: "6months", label: "Within 6 months" },
  { id: "exploring", label: "Just exploring" },
];

export default function QuoteWizard({ dict }: { dict: Dictionary }) {
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedTimeline, setSelectedTimeline] = useState("");
  const [quantity, setQuantity] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const pathname = usePathname() ?? "/";

  const totalSteps = 3;

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Please enter your name and email.");
      return;
    }
    setSubmitting(true);
    setError("");
    const result = await submitQuoteRequest({
      name,
      email,
      whatsapp,
      product: selectedCategory,
      quantity,
      timeline: selectedTimeline,
      message,
    });
    setSubmitting(false);
    if (!result.success) {
      setError(result.error ?? "Something went wrong. Please try again.");
      return;
    }
    trackCtaClick("Quote Wizard Submit", pathname);
    setSubmitted(true);
  };

  const canProceed = () => {
    if (step === 1) return selectedCategory !== "";
    if (step === 2) return selectedTimeline !== "";
    return true;
  };

  return (
    <section id="consultation" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge={dict.consultation.badge}
          title={dict.consultation.title}
          subtitle={dict.consultation.subtitle}
        />

        <Reveal delay={0.15} className="mt-10">
          {submitted ? (
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
          ) : (
            <div className="glass-strong rounded-2xl p-6 sm:p-8">
              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex items-center justify-between">
                  {["Product", "Details", "Contact"].map((label, i) => (
                    <div key={label} className="flex items-center">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all duration-300 ${
                          i + 1 <= step
                            ? "bg-accent text-white"
                            : "bg-surface-2 text-muted"
                        }`}
                      >
                        {i + 1 < step ? (
                          <CheckCircle size={16} />
                        ) : (
                          i + 1
                        )}
                      </div>
                      <span
                        className={`ml-2 hidden text-sm sm:block ${
                          i + 1 <= step ? "text-foreground" : "text-muted"
                        }`}
                      >
                        {label}
                      </span>
                      {i < 2 && (
                        <div
                          className={`mx-3 h-0.5 w-8 transition-all duration-300 sm:w-16 ${
                            i + 1 < step ? "bg-accent" : "bg-surface-2"
                          }`}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 1: Product Category */}
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">
                    What product are you sourcing?
                  </h3>
                  <p className="text-sm text-muted">
                    Select the category that best fits your product.
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {productCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all duration-200 ${
                          selectedCategory === cat.id
                            ? "border-accent bg-accent/10"
                            : "border-border hover:border-accent/50"
                        }`}
                      >
                        <span className="text-2xl">{cat.emoji}</span>
                        <span className="text-xs font-medium">{cat.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Details */}
              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">
                    Tell us about your order
                  </h3>
                  <p className="text-sm text-muted">
                    Help us understand your requirements better.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Estimated Quantity
                      </label>
                      <input
                        type="text"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="e.g., 500 units, 1000 pieces"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Timeline
                      </label>
                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                        {timelines.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => setSelectedTimeline(t.id)}
                            className={`rounded-xl border-2 px-4 py-2.5 text-sm transition-all duration-200 ${
                              selectedTimeline === t.id
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border text-foreground hover:border-accent/50"
                            }`}
                          >
                            {t.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Additional Details
                      </label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Any specific requirements, certifications, or notes..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Contact */}
              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="font-display text-lg font-semibold">
                    How can we reach you?
                  </h3>
                  <p className="text-sm text-muted">
                    We'll respond within 24 hours with a detailed proposal.
                  </p>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Your Name *
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="John Smith"
                        required
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@company.com"
                        required
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium">
                        WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="+1 234 567 8900"
                        className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="mt-8 flex items-center justify-between">
                {step > 1 ? (
                  <button
                    onClick={() => setStep(step - 1)}
                    className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-2"
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>
                ) : (
                  <div />
                )}

                {step < totalSteps ? (
                  <button
                    onClick={() => canProceed() && setStep(step + 1)}
                    disabled={!canProceed()}
                    className="brand-gradient flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
                  >
                    Continue
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="brand-gradient-animated flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-60 disabled:hover:scale-100"
                  >
                    <Send size={16} />
                    {submitting ? "Sending..." : dict.consultation.form.submit}
                  </button>
                )}
              </div>

              {error && (
                <p className="mt-4 text-center text-sm text-red-500">{error}</p>
              )}

              <p className="mt-4 text-center text-xs text-muted">
                {dict.consultation.guarantee}
              </p>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
