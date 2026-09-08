// Free, static supplier red-flags checklist — no external API. Encodes
// the same warning signs a sourcing agent watches for before recommending
// a factory, so a buyer evaluating a supplier they found on their own can
// run the same check themselves.

export interface RedFlagItem {
  id: string;
  label: string;
  explanation: string;
  severity: "high" | "medium";
}

export const RED_FLAGS: RedFlagItem[] = [
  {
    id: "personal_account",
    label: "They ask for payment to a personal bank account or personal Alipay/WeChat, not a registered company account",
    explanation:
      "Legitimate factories get paid through a business bank account tied to their registered company name. Payment to a personal account is the single most common pattern in supplier scams — if the deal falls apart, there's no verifiable company to chase.",
    severity: "high",
  },
  {
    id: "no_business_license",
    label: "They can't or won't share their business license (营业执照) or company registration details",
    explanation:
      "Every legally operating factory in China has a business license with a verifiable registration number. A supplier who dodges this request either isn't who they claim to be, or is a trading company posing as a factory.",
    severity: "high",
  },
  {
    id: "price_too_good",
    label: "Their quoted price is dramatically lower than every other quote you've received for the same spec",
    explanation:
      "An outlier-low price is usually a different (lower) spec than you asked for, a bait-and-switch after deposit, or a listing with no real intent to ship. Get the exact spec in writing and compare like-for-like.",
    severity: "medium",
  },
  {
    id: "no_video_call",
    label: "They refuse a video call or live factory walkthrough when you ask for one",
    explanation:
      "A real factory has nothing to hide about its production floor. This alone doesn't prove fraud, but combined with any other flag here it's a strong signal to slow down.",
    severity: "medium",
  },
  {
    id: "pressure_full_payment",
    label: "They pressure you to pay 100% upfront instead of a standard deposit + balance split",
    explanation:
      "The industry-standard structure is a deposit (commonly 30%) before production and the balance before or at shipment. A supplier insisting on full payment upfront is removing your only leverage if something goes wrong.",
    severity: "high",
  },
  {
    id: "no_samples",
    label: "They won't provide a paid sample before you commit to a bulk order",
    explanation:
      "Reputable factories are used to producing paid samples — buyers covering the sample cost and shipping is normal. A flat refusal, especially alongside pressure to skip straight to bulk, is a red flag.",
    severity: "medium",
  },
  {
    id: "inconsistent_details",
    label: "Company name, address, or bank details are inconsistent across their quote, invoice, and website/listing",
    explanation:
      "Mismatched details across documents is one of the clearest signs of an impersonation scam — a fraudulent party copying a real factory's marketing materials while routing payment elsewhere.",
    severity: "high",
  },
];

export interface RedFlagVerdict {
  level: "clear" | "caution" | "stop";
  headline: string;
  message: string;
}

export function getRedFlagVerdict(checkedIds: string[]): RedFlagVerdict {
  if (checkedIds.length === 0) {
    return {
      level: "clear",
      headline: "No red flags noted",
      message: "That's a good sign — still worth the basic checks (business license, sample, standard payment terms) before you send a deposit.",
    };
  }

  const checkedItems = RED_FLAGS.filter((f) => checkedIds.includes(f.id));
  const hasHigh = checkedItems.some((f) => f.severity === "high");

  if (hasHigh) {
    return {
      level: "stop",
      headline: "Stop before sending any payment",
      message: "At least one of the flags you checked is a serious warning sign on its own. Get a second opinion before you pay a deposit — we can verify this supplier for you at no cost.",
    };
  }

  return {
    level: "caution",
    headline: "A few things worth clarifying first",
    message: "None of these are dealbreakers alone, but get clear answers before you commit — or let us verify the supplier for you.",
  };
}
