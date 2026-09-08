// Free, rule-based sourcing-readiness quiz — no external API, no cost.
// A short yes/no checklist that scores how ready a buyer is to move to a
// formal quote, with a specific, actionable tip for anything they answered
// "not yet" on — the kind of pre-quote screening a sourcing agent would
// normally do by phone.

export interface QuizQuestionContent {
  question: string;
  tip: string;
}

export interface QuizQuestion extends QuizQuestionContent {
  id: string;
}

export const QUIZ_QUESTION_IDS = ["reference", "quantity", "certifications", "budget", "timeline"];

export function getQuizQuestions(content: Record<string, QuizQuestionContent>): QuizQuestion[] {
  return QUIZ_QUESTION_IDS.map((id) => ({ id, ...content[id] }));
}

export interface TierContent {
  label: string;
  message: string;
}

export interface ReadinessResult {
  score: number;
  total: number;
  tier: "ready" | "almost" | "early";
  tierLabel: string;
  tierMessage: string;
  missingTips: string[];
}

export function getReadinessResult(
  answers: (boolean | null)[],
  questions: QuizQuestion[],
  tiers: { ready: TierContent; almost: TierContent; early: TierContent }
): ReadinessResult {
  const total = questions.length;
  const score = answers.filter((a) => a === true).length;

  const missingTips = questions.filter((_, i) => answers[i] !== true).map((q) => q.tip);

  let tier: ReadinessResult["tier"];
  let tierContent: TierContent;
  if (score === total) {
    tier = "ready";
    tierContent = tiers.ready;
  } else if (score >= Math.ceil(total / 2)) {
    tier = "almost";
    tierContent = tiers.almost;
  } else {
    tier = "early";
    tierContent = tiers.early;
  }

  return { score, total, tier, tierLabel: tierContent.label, tierMessage: tierContent.message, missingTips };
}
