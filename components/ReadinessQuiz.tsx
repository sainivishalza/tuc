"use client";

import { useState } from "react";
import { ClipboardCheck, ArrowRight, Check, X } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import { QUIZ_QUESTIONS, getReadinessResult, type ReadinessResult } from "@/lib/readinessQuiz";

const TIER_STYLES: Record<ReadinessResult["tier"], string> = {
  ready: "bg-green-500/15 text-green-600",
  almost: "bg-amber-500/15 text-amber-600",
  early: "bg-accent/15 text-accent",
};

export default function ReadinessQuiz() {
  const [answers, setAnswers] = useState<(boolean | null)[]>(QUIZ_QUESTIONS.map(() => null));
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const pathname = usePathname() ?? "/";

  const allAnswered = answers.every((a) => a !== null);

  const handleAnswer = (index: number, value: boolean) => {
    const next = [...answers];
    next[index] = value;
    setAnswers(next);
    setResult(null);
  };

  const handleSeeScore = () => {
    if (!allAnswered) return;
    setResult(getReadinessResult(answers));
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("Readiness Quiz Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: { message: `Sourcing readiness score: ${result.score}/${result.total} (${result.tierLabel}).` },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="readiness-quiz" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          badge="Free · 30-Second Check"
          title="Are You Ready to Get a Quote?"
          subtitle="Answer five quick questions and see exactly what to prepare before you talk to a sourcing agent — and what you can already skip."
        />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="space-y-5">
              {QUIZ_QUESTIONS.map((q, i) => (
                <div key={q.id} className="border-b border-border pb-5 last:border-0 last:pb-0">
                  <p className="text-sm font-medium">{q.question}</p>
                  <div className="mt-3 flex gap-3">
                    <button
                      onClick={() => handleAnswer(i, true)}
                      className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        answers[i] === true
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-foreground hover:border-accent/50"
                      }`}
                    >
                      <Check size={14} />
                      Yes
                    </button>
                    <button
                      onClick={() => handleAnswer(i, false)}
                      className={`flex items-center gap-1.5 rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-200 ${
                        answers[i] === false
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-border text-foreground hover:border-accent/50"
                      }`}
                    >
                      <X size={14} />
                      Not yet
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSeeScore}
              disabled={!allAnswered}
              className="brand-gradient mt-6 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
            >
              <ClipboardCheck size={16} />
              See My Readiness Score
            </button>

            {result && (
              <Reveal delay={0} className="mt-6">
                <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-display text-2xl font-bold">
                      {result.score}/{result.total}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${TIER_STYLES[result.tier]}`}>
                      {result.tierLabel}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-muted">{result.tierMessage}</p>

                  {result.missingTips.length > 0 && (
                    <div className="mt-5 space-y-3">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted">
                        Before you request a quote
                      </p>
                      {result.missingTips.map((tip) => (
                        <p key={tip} className="rounded-lg bg-accent/5 px-4 py-3 text-sm text-muted">
                          {tip}
                        </p>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={handleGetQuote}
                    className="brand-gradient-animated mt-5 flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 transition-all hover:scale-[1.02]"
                  >
                    Get a Quote Anyway
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
