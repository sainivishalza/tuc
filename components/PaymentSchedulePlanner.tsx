"use client";

import { useState } from "react";
import { Wallet, ArrowRight, CircleDollarSign } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { buildPaymentSchedule, type PaymentScheduleResult } from "@/lib/paymentSchedule";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function formatUsd(value: number): string {
  return value.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

function formatDate(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default function PaymentSchedulePlanner({ locale }: { locale: Locale }) {
  const [totalValue, setTotalValue] = useState("10000");
  const [depositPct, setDepositPct] = useState("30");
  const [leadTime, setLeadTime] = useState("35");
  const [orderDate, setOrderDate] = useState(todayIso);
  const [result, setResult] = useState<PaymentScheduleResult | null>(null);
  const pathname = usePathname() ?? "/";

  const value = Number(totalValue);
  const pct = Number(depositPct);
  const days = Number(leadTime);
  const canGenerate = value > 0 && pct > 0 && pct <= 100 && days > 0 && Boolean(orderDate);

  const handleGenerate = () => {
    if (!canGenerate) return;
    setResult(buildPaymentSchedule({ totalValue: value, depositPct: pct, leadTimeDays: days }, orderDate));
  };

  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · Instant Schedule"
          title="Plan Your Payment Schedule"
          subtitle="See the actual dates and amounts you'll be asked for — deposit, balance, and everything in between — before you agree to anything."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">Total order value (USD)</label>
                <input
                  type="number"
                  min="0"
                  value={totalValue}
                  onChange={(e) => setTotalValue(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Deposit (%)</label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={depositPct}
                  onChange={(e) => setDepositPct(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-muted">Typical range: 20-50%. 30% is standard.</p>
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Production lead time (days)</label>
                <input
                  type="number"
                  min="1"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">Order confirmation date</label>
                <input
                  type="date"
                  value={orderDate}
                  onChange={(e) => setOrderDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <Wallet size={16} />
              Generate Schedule
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-col divide-y divide-border">
                    {result.milestones.map((m) => (
                      <div key={m.label} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                          <CircleDollarSign size={16} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="font-display text-sm font-semibold">{m.label}</p>
                            <p className="text-xs font-medium text-muted">{formatDate(m.date)}</p>
                          </div>
                          {m.amount !== null && (
                            <p className="mt-0.5 text-sm font-semibold text-accent">{formatUsd(m.amount)}</p>
                          )}
                          <p className="mt-1 text-sm text-muted">{m.note}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <p className="mt-5 rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                    <strong className="text-foreground">First order with this supplier?</strong> Consider routing the
                    deposit through a Trade Assurance or escrow-style payment instead of a direct wire — it holds your
                    payment until the supplier ships what was agreed.
                  </p>

                  <a
                    href={`/${locale}#consultation`}
                    onClick={() => trackCtaClick("Payment Schedule Get Quote", pathname)}
                    className="brand-gradient-animated mt-5 flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get a Quote
                    <ArrowRight size={16} />
                  </a>
                </div>
              </Reveal>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
