"use client";

import { useState } from "react";
import { ClipboardCheck, ArrowRight, Check, X } from "lucide-react";
import Reveal from "./Reveal";
import { SectionHeading } from "./Services";
import { trackCtaClick } from "@/lib/analytics";
import { usePathname } from "next/navigation";
import type { Dictionary } from "@/lib/i18n";
import { getQuizQuestions, getReadinessResult, type ReadinessResult } from "@/lib/readinessQuiz";

const TIER_STYLES: Record<ReadinessResult["tier"], string> = {
  ready: "bg-green-500/15 text-green-600",
  almost: "bg-amber-500/15 text-amber-600",
  early: "bg-accent/15 text-accent",
};

export default function ReadinessQuiz({ dict }: { dict: Dictionary }) {
  const t = dict.tools.readinessQuiz;
  const questions = getQuizQuestions(t.questions);

  const [answers, setAnswers] = useState<(boolean | null)[]>(questions.map(() => null));
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
    setResult(getReadinessResult(answers, questions, t.tiers));
  };

  const handleGetQuote = () => {
    if (!result) return;
    trackCtaClick("Readiness Quiz Get Quote", pathname);
    window.dispatchEvent(
      new CustomEvent("tuc:quote-prefill", {
        detail: {
          message: t.quoteMessage
            .replace("{score}", String(result.score))
            .replace("{total}", String(result.total))
            .replace("{tier}", result.tierLabel),
        },
      })
    );
    document.getElementById("consultation")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="readiness-quiz" className="relative px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <SectionHeading badge={t.badge} title={t.title} subtitle={t.subtitle} />

        <Reveal delay={0.15} className="mt-10">
          <div className="glass-strong rounded-2xl p-6 sm:p-8">
            <div className="space-y-5">
              {questions.map((q, i) => (
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
                      {t.yes}
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
                      {t.notYet}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={handleSeeScore}
              disabled={!allAnswered}
              className="btn-primary mt-6"
            >
              <ClipboardCheck size={16} />
              {t.seeScore}
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
                        {t.beforeYouRequest}
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
                    className="btn-primary mt-5"
                  >
                    {t.getQuoteAnyway}
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
