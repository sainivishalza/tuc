"use client";

import { useState } from "react";
import { Compass, ArrowRight, RotateCcw } from "lucide-react";
import Reveal from "./Reveal";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import {
  INCOTERM_PROFILES,
  pickIncoterm,
  type Step1Answer,
  type Step2DestinationAnswer,
  type Step2NothingAnswer,
} from "@/lib/incotermGuide";

const OPTION_CLASS =
  "w-full rounded-xl border-2 border-border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 hover:border-accent/50";

export default function IncotermGuide({ locale }: { locale: Locale }) {
  const [step1, setStep1] = useState<Step1Answer | null>(null);
  const [step2Destination, setStep2Destination] = useState<Step2DestinationAnswer | null>(null);
  const [step2Nothing, setStep2Nothing] = useState<Step2NothingAnswer | null>(null);
  const pathname = usePathname() ?? "/";

  const resultId = pickIncoterm(step1, step2Destination, step2Nothing);
  const result = resultId ? INCOTERM_PROFILES[resultId] : null;

  const reset = () => {
    setStep1(null);
    setStep2Destination(null);
    setStep2Nothing(null);
  };

  return (
    <section className="px-4 pb-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Reveal>
          <span className="eyebrow accent-text text-xs sm:text-sm">Free · 2-Question Guide</span>
          <h2 className="font-display mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
            Which Shipping Term Should You Use?
          </h2>
          <p className="mt-3 text-sm text-muted sm:text-base">
            EXW, FOB, CIF, DAP, DDP — the letters your supplier throws at you decide who pays for what,
            and who&apos;s on the hook if something goes wrong. Answer two questions to find yours.
          </p>
        </Reveal>

        <Reveal delay={0.1} className="mt-8">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            {!result && (
              <div className="space-y-3">
                <h3 className="font-display text-base font-semibold">
                  How much of the shipping process do you want to handle yourself?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setStep1("everything")}>
                  Everything — I have my own freight forwarder and customs broker
                </button>
                <button className={OPTION_CLASS} onClick={() => setStep1("destination_side")}>
                  Just the destination side — I&apos;ll clear customs and arrange final delivery myself
                </button>
                <button className={OPTION_CLASS} onClick={() => setStep1("nothing")}>
                  Nothing — I want it delivered to my door with as little hassle as possible
                </button>
              </div>
            )}

            {!result && step1 === "destination_side" && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">
                  Do you want to book the main freight yourself, or have the supplier arrange and insure it to your port?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setStep2Destination("book_myself")}>
                  I&apos;ll book the freight myself
                </button>
                <button className={OPTION_CLASS} onClick={() => setStep2Destination("supplier_arranges")}>
                  Let the supplier arrange and insure it
                </button>
              </div>
            )}

            {!result && step1 === "nothing" && (
              <div className="mt-6 space-y-3 border-t border-border pt-6">
                <h3 className="font-display text-base font-semibold">
                  Do you want to personally handle import duties and taxes, or have them included in one price?
                </h3>
                <button className={OPTION_CLASS} onClick={() => setStep2Nothing("handle_duties_myself")}>
                  I&apos;ll handle duties and taxes myself
                </button>
                <button className={OPTION_CLASS} onClick={() => setStep2Nothing("all_included")}>
                  Include everything in one price
                </button>
              </div>
            )}

            {result && (
              <Reveal delay={0}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Compass size={18} />
                  </div>
                  <h3 className="font-display text-lg font-semibold">{result.name}</h3>
                </div>
                <p className="mt-3 text-sm text-muted">{result.summary}</p>

                <div className="mt-5 overflow-hidden rounded-xl border border-border">
                  {result.responsibilities.map((r, i) => (
                    <div
                      key={r.stage}
                      className={`flex items-center justify-between px-4 py-3 text-sm ${i % 2 === 0 ? "bg-surface" : "bg-surface-2"}`}
                    >
                      <span>{r.stage}</span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${
                          r.party === "You" ? "bg-accent/15 text-accent" : "bg-surface-2 text-foreground"
                        }`}
                      >
                        {r.party}
                      </span>
                    </div>
                  ))}
                </div>

                <p className="mt-5 rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                  <strong className="text-foreground">Watch out:</strong> {result.watchOut}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={reset}
                    className="flex items-center gap-2 rounded-full border border-border px-5 py-2.5 text-sm font-medium transition hover:bg-surface-2"
                  >
                    <RotateCcw size={15} />
                    Start over
                  </button>
                  <a
                    href={`/${locale}#consultation`}
                    onClick={() => trackCtaClick("Incoterm Guide Get Quote", pathname)}
                    className="brand-gradient-animated flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get a Quote — mention {result.id} terms
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
