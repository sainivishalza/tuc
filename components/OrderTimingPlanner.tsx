"use client";

import { useState } from "react";
import { CalendarClock, ArrowRight, CheckCircle2, AlertTriangle } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary, Locale } from "@/lib/i18n";
import { getCalendarEvents, planOrderTiming, type TimingResult } from "@/lib/orderTiming";

const DATE_LOCALES: Record<Locale, string> = { en: "en-US", zh: "zh-CN", ru: "ru-RU" };

function defaultTargetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 90);
  return d.toISOString().slice(0, 10);
}

export default function OrderTimingPlanner({ dict, locale }: { dict: Dictionary; locale: Locale }) {
  const t = dict.tools.orderTiming;
  const events = getCalendarEvents(t.events);

  function formatDate(iso: string): string {
    return new Date(`${iso}T00:00:00Z`).toLocaleDateString(DATE_LOCALES[locale], {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    });
  }

  const [targetDate, setTargetDate] = useState(defaultTargetDate);
  const [leadTime, setLeadTime] = useState("45");
  const [result, setResult] = useState<TimingResult | null>(null);
  const pathname = usePathname() ?? "/";

  const days = Number(leadTime);
  const canCheck = Boolean(targetDate) && days > 0;

  const handleCheck = () => {
    if (!canCheck) return;
    setResult(planOrderTiming(targetDate, days, events));
  };

  const closures = result?.conflicts.filter((c) => c.impact === "closure") ?? [];
  const peakSeasons = result?.conflicts.filter((c) => c.impact === "peak-season") ?? [];

  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium">{t.targetDateLabel}</label>
                <input
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium">{t.leadTimeLabel}</label>
                <input
                  type="number"
                  min="1"
                  value={leadTime}
                  onChange={(e) => setLeadTime(e.target.value)}
                  className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <p className="mt-1.5 text-xs text-muted">{t.leadTimeHint}</p>
              </div>
            </div>

            <button
              onClick={handleCheck}
              disabled={!canCheck}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <CalendarClock size={16} />
              {t.checkButton}
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  {closures.length === 0 ? (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-600">
                        <CheckCircle2 size={16} />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold">
                          {t.placeOrderBy.replace("{date}", formatDate(result.orderByDate))}
                        </p>
                        <p className="mt-1 text-sm text-muted">{t.noClosures}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600">
                        <AlertTriangle size={16} />
                      </span>
                      <div>
                        <p className="font-display text-base font-semibold">
                          {t.orderByNotDate
                            .replace(
                              "{adjusted}",
                              formatDate(result.adjustedOrderByDate ?? result.orderByDate)
                            )
                            .replace("{original}", formatDate(result.orderByDate))}
                        </p>
                        <p className="mt-1 text-sm text-muted">
                          {(result.totalClosureDays === 1 ? t.closureOverlapOne : t.closureOverlapMany).replace(
                            "{days}",
                            String(result.totalClosureDays)
                          )}
                        </p>
                      </div>
                    </div>
                  )}

                  {result.conflicts.length > 0 && (
                    <div className="mt-5 space-y-3">
                      {closures.map((c) => (
                        <p key={c.name} className="rounded-lg bg-amber-500/5 px-4 py-3 text-sm text-muted">
                          <strong className="text-foreground">{c.name}</strong> ({formatDate(c.start)} – {formatDate(c.end)}): {c.note}
                        </p>
                      ))}
                      {peakSeasons.map((c) => (
                        <p key={c.name} className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                          <strong className="text-foreground">{c.name}</strong> ({formatDate(c.start)} – {formatDate(c.end)}): {c.note}
                        </p>
                      ))}
                    </div>
                  )}

                  <a
                    href={`/${locale}#consultation`}
                    onClick={() => trackCtaClick("Order Timing Get Quote", pathname)}
                    className="brand-gradient-animated mt-5 flex w-fit items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    {t.getQuote}
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
