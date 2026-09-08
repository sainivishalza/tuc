// Free, rule-based sourcing-readiness quiz — no external API, no cost.
// A short yes/no checklist that scores how ready a buyer is to move to a
// formal quote, with a specific, actionable tip for anything they answered
// "not yet" on — the kind of pre-quote screening a sourcing agent would
// normally do by phone.

export interface QuizQuestion {
  id: string;
  question: string;
  tip: string;
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "reference",
    question: "Do you have a product reference — a photo, link, or sample — ready to share?",
    tip: "Send us a photo, a link to a similar product, or a sample. It's the single fastest way to get an accurate quote.",
  },
  {
    id: "quantity",
    question: "Do you know your target quantity, or at least a rough MOQ range?",
    tip: "Even a rough range (e.g. \"500–1,000 units\") lets us quote realistic per-unit pricing — exact MOQs vary a lot by factory.",
  },
  {
    id: "certifications",
    question: "Do you know which certifications your destination market requires (CE, FCC, FDA, RoHS, etc.)?",
    tip: "Certification needs depend on your product and destination country. Mention your target market and we'll flag what's required.",
  },
  {
    id: "budget",
    question: "Do you have a target unit price or budget range in mind?",
    tip: "A target price helps us recommend the right tier of factory instead of showing you options outside your budget.",
  },
  {
    id: "timeline",
    question: "Do you have a shipping deadline or timeline in mind?",
    tip: "Even \"sometime next quarter\" helps us pick between sea, air, and express freight when we quote your shipping cost.",
  },
];

export interface ReadinessResult {
  score: number;
  total: number;
  tier: "ready" | "almost" | "early";
  tierLabel: string;
  tierMessage: string;
  missingTips: string[];
}

export function getReadinessResult(answers: (boolean | null)[]): ReadinessResult {
  const total = QUIZ_QUESTIONS.length;
  const score = answers.filter((a) => a === true).length;

  const missingTips = QUIZ_QUESTIONS.filter((_, i) => answers[i] !== true).map((q) => q.tip);

  let tier: ReadinessResult["tier"];
  let tierLabel: string;
  let tierMessage: string;
  if (score === total) {
    tier = "ready";
    tierLabel = "Fully ready";
    tierMessage = "You've got everything a quote needs — skip straight to the form and we'll respond within 24 hours.";
  } else if (score >= Math.ceil(total / 2)) {
    tier = "almost";
    tierLabel = "Almost ready";
    tierMessage = "You're most of the way there. Fill in the gaps below and your quote will come back faster and more accurate.";
  } else {
    tier = "early";
    tierLabel = "Early stage";
    tierMessage = "That's completely normal this early on — most buyers start here. Try the Smart Match tool above to firm up the basics first.";
  }

  return { score, total, tier, tierLabel, tierMessage, missingTips };
}
