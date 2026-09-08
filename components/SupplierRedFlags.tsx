"use client";

import { useState } from "react";
import { ShieldAlert, ArrowRight, CheckCircle2, AlertTriangle, OctagonAlert } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { RED_FLAGS, getRedFlagVerdict } from "@/lib/supplierRedFlags";

const VERDICT_STYLES = {
  clear: { icon: CheckCircle2, className: "bg-green-500/15 text-green-600" },
  caution: { icon: AlertTriangle, className: "bg-amber-500/15 text-amber-600" },
  stop: { icon: OctagonAlert, className: "bg-red-500/15 text-red-600" },
} as const;

export default function SupplierRedFlags() {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const pathname = usePathname() ?? "/";

  const toggle = (id: string) => {
    setSubmitted(false);
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const checkedIds = Array.from(checked);
  const verdict = submitted ? getRedFlagVerdict(checkedIds) : null;
  const VerdictIcon = verdict ? VERDICT_STYLES[verdict.level].icon : null;
  const checkedFlags = RED_FLAGS.filter((f) => checked.has(f.id));

  const handleGetHelp = () => {
    trackCtaClick("Supplier Red Flags Get Help", pathname);
    const summary =
      checkedFlags.length > 0
        ? `I'd like help verifying a supplier. Red flags I noticed: ${checkedFlags.map((f) => f.label).join("; ")}.`
        : "I'd like help verifying a supplier before I send a deposit.";
    window.dispatchEvent(new CustomEvent("tuc:quote-prefill", { detail: { message: summary } }));
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · Supplier Safety Check"
          title="Is Your Supplier Legit?"
          subtitle="Check off anything that applies to a factory or trading company you're considering. These are the same warning signs we screen for before ever recommending a supplier."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="space-y-3">
              {RED_FLAGS.map((flag) => (
                <label
                  key={flag.id}
                  className={`flex cursor-pointer items-start gap-3 rounded-xl border-2 p-4 transition-all duration-200 ${
                    checked.has(flag.id) ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked.has(flag.id)}
                    onChange={() => toggle(flag.id)}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-600"
                  />
                  <span className="text-sm">{flag.label}</span>
                </label>
              ))}
            </div>

            <button
              onClick={() => setSubmitted(true)}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
            >
              <ShieldAlert size={16} />
              Check Result
            </button>

            {verdict && VerdictIcon && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${VERDICT_STYLES[verdict.level].className}`}>
                      <VerdictIcon size={20} />
                    </span>
                    <h3 className="font-display text-lg font-semibold">{verdict.headline}</h3>
                  </div>
                  <p className="mt-3 text-sm text-muted">{verdict.message}</p>

                  {checkedFlags.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Why this matters</p>
                      {checkedFlags.map((f) => (
                        <p key={f.id} className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                          <strong className="text-foreground">{f.label}.</strong> {f.explanation}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGetHelp}
                    className="brand-gradient-animated mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get Help Verifying This Supplier
                    <ArrowRight size={16} />
                  </button>
                </div>
              </Reveal>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
