// Free, rule-based sourcing match engine — no external API calls, no cost.
// Scores a customer's free-text product description against keyword
// profiles for each category the business already sources, and surfaces
// the same kind of practical guidance a sourcing agent would give on a
// first call (typical MOQ, lead time, certifications, red flags).
//
// The keyword lists below are English-only — free-text matching against
// a description typed in Chinese or Russian will usually fall through to
// the "other" profile. The result content itself (labels, MOQ, tips) is
// fully localized via the `content` passed in from the dictionary, so a
// non-English visitor still gets a translated, if less targeted, result.

export interface CategoryProfileContent {
  label: string;
  moq: string;
  leadTime: string;
  certs: string;
  tip: string;
}

export interface CategoryProfile extends CategoryProfileContent {
  id: string;
  keywords: string[];
}

export const CATEGORY_IDS = ["electronics", "home", "fashion", "building", "packaging", "auto"] as const;

const CATEGORY_KEYWORDS: Record<(typeof CATEGORY_IDS)[number], string[]> = {
  electronics: [
    "electronic", "gadget", "device", "charger", "cable", "earbud", "headphone",
    "speaker", "smart watch", "smartwatch", "led", "light strip", "camera",
    "drone", "power bank", "battery", "bluetooth", "wifi", "sensor", "pcb",
    "circuit", "phone case", "accessory", "usb", "adapter",
  ],
  home: [
    "home", "kitchen", "furniture", "appliance", "cookware", "decor",
    "storage", "organizer", "bedding", "towel", "utensil", "container",
    "cleaning", "vacuum", "blender", "mug", "cup", "plate", "ceramic", "glass",
  ],
  fashion: [
    "fashion", "textile", "clothing", "apparel", "shirt", "dress", "fabric",
    "shoe", "footwear", "bag", "handbag", "jewelry", "accessory", "hat",
    "sock", "jacket", "denim", "cotton", "polyester", "embroidery",
  ],
  building: [
    "building", "construction", "tile", "fixture", "lighting", "hardware",
    "door", "window", "flooring", "cement", "pipe", "faucet", "valve",
    "cabinet", "insulation", "steel", "aluminum", "sanitary",
  ],
  packaging: [
    "packaging", "printing", "box", "label", "carton", "sticker", "sleeve",
    "pouch", "bag", "print", "branding", "custom box", "gift box", "tag",
  ],
  auto: [
    "auto", "car", "vehicle", "tool", "wrench", "tire", "engine", "mechanic",
    "industrial", "equipment", "machine", "drill", "hardware tool", "spare part",
  ],
};

export function getCategoryProfiles(content: Record<string, CategoryProfileContent>): CategoryProfile[] {
  return CATEGORY_IDS.map((id) => ({ id, keywords: CATEGORY_KEYWORDS[id], ...content[id] }));
}

export function getOtherProfile(content: CategoryProfileContent): CategoryProfile {
  return { id: "other", keywords: [], ...content };
}

const TIMELINE_ASAP = ["asap", "urgent", "urgently", "rush", "immediately", "right away"];
const TIMELINE_EXPLORING = ["just looking", "just exploring", "researching", "not sure yet", "no rush"];

const REQUIREMENT_RULES: { tag: string; keywords: string[] }[] = [
  { tag: "waterproof", keywords: ["waterproof", "water-resistant", "ip65", "ip67", "ip68", "outdoor use", "weatherproof"] },
  { tag: "branding", keywords: ["custom logo", "private label", "oem", "odm", "own brand", "branding", "custom packaging"] },
  { tag: "foodGrade", keywords: ["food grade", "food-grade", "fda", "food contact", "food safe"] },
  { tag: "regulatory", keywords: ["ce certified", "ce certification", "fcc", "rohs", "ul certified", "certification required", "compliance"] },
  { tag: "battery", keywords: ["battery", "lithium", "rechargeable", "li-ion"] },
  { tag: "fragile", keywords: ["fragile", "glass", "ceramic", "breakable"] },
  { tag: "ecoFriendly", keywords: ["eco-friendly", "eco friendly", "sustainable", "biodegradable", "recycled", "recyclable"] },
  { tag: "childSafety", keywords: ["kids", "children", "child", "toy", "toys"] },
];

export interface MatchResult {
  profile: CategoryProfile;
  confidence: "high" | "medium" | "low";
  matchedKeywords: string[];
  quantity: string | null;
  timelineId: "asap" | "1month" | "3months" | "exploring" | null;
  requirementIds: string[];
}

function normalize(text: string): string {
  return text.toLowerCase();
}

function detectQuantity(text: string): string | null {
  const match = text.match(/(\d[\d,]{0,9})\s*(pieces|pcs|units|sets|pairs|boxes|cartons|containers)?/i);
  if (!match) return null;
  const number = match[1];
  const unit = match[2];
  if (Number(number.replace(/,/g, "")) < 1) return null;
  return unit ? `${number} ${unit}` : number;
}

function detectTimeline(text: string): MatchResult["timelineId"] {
  if (TIMELINE_ASAP.some((kw) => text.includes(kw))) return "asap";
  if (TIMELINE_EXPLORING.some((kw) => text.includes(kw))) return "exploring";
  const monthMatch = text.match(/(\d+)\s*month/);
  if (monthMatch) {
    const months = Number(monthMatch[1]);
    return months <= 1 ? "1month" : "3months";
  }
  if (text.includes("next month")) return "1month";
  return null;
}

function detectRequirements(text: string): string[] {
  return REQUIREMENT_RULES.filter((rule) => rule.keywords.some((kw) => text.includes(kw))).map((rule) => rule.tag);
}

export function matchProduct(
  description: string,
  categories: CategoryProfile[],
  otherProfile: CategoryProfile
): MatchResult {
  const text = normalize(description);

  let bestProfile: CategoryProfile = otherProfile;
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const profile of categories) {
    const matches = profile.keywords.filter((kw) => text.includes(kw));
    if (matches.length > bestScore) {
      bestScore = matches.length;
      bestProfile = profile;
      bestMatches = matches;
    }
  }

  const confidence: MatchResult["confidence"] = bestScore >= 3 ? "high" : bestScore >= 1 ? "medium" : "low";

  return {
    profile: bestProfile,
    confidence,
    matchedKeywords: bestMatches,
    quantity: detectQuantity(text),
    timelineId: detectTimeline(text),
    requirementIds: detectRequirements(text),
  };
}
