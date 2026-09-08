// Free, rule-based sourcing match engine — no external API calls, no cost.
// Scores a customer's free-text product description against keyword
// profiles for each category the business already sources, and surfaces
// the same kind of practical guidance a sourcing agent would give on a
// first call (typical MOQ, lead time, certifications, red flags).

export interface CategoryProfile {
  id: string;
  label: string;
  emoji: string;
  keywords: string[];
  moq: string;
  leadTime: string;
  certs: string;
  tip: string;
}

export const CATEGORY_PROFILES: CategoryProfile[] = [
  {
    id: "electronics",
    label: "Electronics & Gadgets",
    emoji: "⚡",
    keywords: [
      "electronic", "gadget", "device", "charger", "cable", "earbud", "headphone",
      "speaker", "smart watch", "smartwatch", "led", "light strip", "camera",
      "drone", "power bank", "battery", "bluetooth", "wifi", "sensor", "pcb",
      "circuit", "phone case", "accessory", "usb", "adapter",
    ],
    moq: "300–1,000 pcs for a first order",
    leadTime: "25–40 days production",
    certs: "CE / FCC / RoHS — required for most EU/US electronics imports",
    tip: "Ask the factory for a UN38.3 report up front if the product contains a lithium battery — it's required for air/sea freight and often takes the longest to get.",
  },
  {
    id: "home",
    label: "Home & Kitchen",
    emoji: "🏠",
    keywords: [
      "home", "kitchen", "furniture", "appliance", "cookware", "decor",
      "storage", "organizer", "bedding", "towel", "utensil", "container",
      "cleaning", "vacuum", "blender", "mug", "cup", "plate", "ceramic", "glass",
    ],
    moq: "500–2,000 pcs for a first order",
    leadTime: "20–35 days production",
    certs: "LFGB/FDA food-contact testing for anything touching food or drink",
    tip: "Glass and ceramic pieces need reinforced export cartons and often a color-box redesign — build both into your first-sample budget.",
  },
  {
    id: "fashion",
    label: "Fashion & Textiles",
    emoji: "👔",
    keywords: [
      "fashion", "textile", "clothing", "apparel", "shirt", "dress", "fabric",
      "shoe", "footwear", "bag", "handbag", "jewelry", "accessory", "hat",
      "sock", "jacket", "denim", "cotton", "polyester", "embroidery",
    ],
    moq: "500–3,000 pcs per style/color for a first order",
    leadTime: "30–45 days production (add 7–10 days if custom fabric is dyed to order)",
    certs: "Care-label & fiber-content compliance for your destination market",
    tip: "Lock your size chart and colorway before bulk production — mid-run changes on apparel are the most common cause of delays we see.",
  },
  {
    id: "building",
    label: "Building Materials",
    emoji: "🏗️",
    keywords: [
      "building", "construction", "tile", "fixture", "lighting", "hardware",
      "door", "window", "flooring", "cement", "pipe", "faucet", "valve",
      "cabinet", "insulation", "steel", "aluminum", "sanitary",
    ],
    moq: "1 container (LCL or FCL) is typical for a first order",
    leadTime: "30–50 days production, longer for custom fittings",
    certs: "ISO / local building-code compliance — varies significantly by destination country",
    tip: "Get a pre-shipment inspection booked for anything ceramic or glass-based — breakage claims are far harder to resolve after the container has left port.",
  },
  {
    id: "packaging",
    label: "Packaging & Printing",
    emoji: "📦",
    keywords: [
      "packaging", "printing", "box", "label", "carton", "sticker", "sleeve",
      "pouch", "bag", "print", "branding", "custom box", "gift box", "tag",
    ],
    moq: "1,000–5,000 pcs for a first custom-print order",
    leadTime: "15–25 days production once artwork is approved",
    certs: "FSC certification available on request if recyclable/sustainable sourcing matters to your buyers",
    tip: "Ask for a physical die-line sample (not just a digital proof) before mass production — colors and fold lines both shift on press.",
  },
  {
    id: "auto",
    label: "Auto Parts & Tools",
    emoji: "🔧",
    keywords: [
      "auto", "car", "vehicle", "tool", "wrench", "tire", "engine", "mechanic",
      "industrial", "equipment", "machine", "drill", "hardware tool", "spare part",
    ],
    moq: "500–2,000 pcs for a first order",
    leadTime: "25–40 days production",
    certs: "DOT / ISO / CE depending on the part and destination market",
    tip: "For fitment-sensitive parts, request a sample against your exact vehicle/machine spec before committing to bulk — generic 'universal fit' claims are the top cause of returns.",
  },
];

const OTHER_PROFILE: CategoryProfile = {
  id: "other",
  label: "Other / Not Sure Yet",
  emoji: "✨",
  keywords: [],
  moq: "Varies by product — we'll confirm once we see your item",
  leadTime: "Typically 20–45 days depending on complexity",
  certs: "We'll flag what's required once we know your product and destination market",
  tip: "No exact match yet — describe the product a little more (material, use case, or a reference link) and we'll route it to the right specialist.",
};

const TIMELINE_ASAP = ["asap", "urgent", "urgently", "rush", "immediately", "right away"];
const TIMELINE_EXPLORING = ["just looking", "just exploring", "researching", "not sure yet", "no rush"];

const REQUIREMENT_RULES: { tag: string; keywords: string[] }[] = [
  { tag: "Waterproof / weatherproof rating (IP65+)", keywords: ["waterproof", "water-resistant", "ip65", "ip67", "ip68", "outdoor use", "weatherproof"] },
  { tag: "Custom branding (OEM/private label)", keywords: ["custom logo", "private label", "oem", "odm", "own brand", "branding", "custom packaging"] },
  { tag: "Food-grade certification (FDA/food contact)", keywords: ["food grade", "food-grade", "fda", "food contact", "food safe"] },
  { tag: "Regulatory certification (CE/FCC/RoHS)", keywords: ["ce certified", "ce certification", "fcc", "rohs", "ul certified", "certification required", "compliance"] },
  { tag: "Lithium battery — air freight restrictions apply", keywords: ["battery", "lithium", "rechargeable", "li-ion"] },
  { tag: "Fragile — reinforced packaging needed", keywords: ["fragile", "glass", "ceramic", "breakable"] },
  { tag: "Eco-friendly / sustainable materials", keywords: ["eco-friendly", "eco friendly", "sustainable", "biodegradable", "recycled", "recyclable"] },
  { tag: "Child safety compliance (ASTM/EN71)", keywords: ["kids", "children", "child", "toy", "toys"] },
];

export interface MatchResult {
  profile: CategoryProfile;
  confidence: "high" | "medium" | "low";
  matchedKeywords: string[];
  quantity: string | null;
  timelineId: "asap" | "1month" | "3months" | "exploring" | null;
  requirements: string[];
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

export function matchProduct(description: string): MatchResult {
  const text = normalize(description);

  let bestProfile: CategoryProfile = OTHER_PROFILE;
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const profile of CATEGORY_PROFILES) {
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
    requirements: detectRequirements(text),
  };
}
