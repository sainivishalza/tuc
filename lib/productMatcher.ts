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
    "electronic", "electronics", "gadget", "device", "charger", "cable", "cord",
    "earbud", "earbuds", "earphone", "headphone", "headset", "speaker",
    "smart watch", "smartwatch", "wearable", "fitness tracker", "led", "led light",
    "light strip", "led strip", "neon light", "camera", "webcam", "cctv",
    "drone", "power bank", "power station", "battery", "solar charger",
    "bluetooth", "wifi", "wireless", "router", "sensor", "pcb", "circuit",
    "circuit board", "phone case", "screen protector", "tablet", "laptop",
    "monitor", "tv", "television", "projector", "accessory", "usb",
    "usb-c", "type-c", "adapter", "converter", "charging dock", "docking station",
    "keyboard", "mouse", "microphone", "mic", "gaming", "console", "game controller",
    "smart home", "smart plug", "smart bulb", "doorbell camera", "alarm system",
    "walkie talkie", "gps tracker", "digital", "electric toothbrush", "hair dryer",
    "shaver", "trimmer", "e-cigarette", "vape",
  ],
  home: [
    "home", "kitchen", "furniture", "appliance", "cookware", "bakeware", "decor",
    "decoration", "storage", "organizer", "shelving", "shelf", "rack",
    "bedding", "mattress", "pillow", "blanket", "curtain", "rug", "carpet",
    "towel", "linen", "utensil", "cutlery", "container", "jar", "bottle",
    "cleaning", "cleaning supplies", "mop", "broom", "vacuum", "air purifier",
    "humidifier", "fan", "heater", "blender", "mixer", "juicer", "kettle",
    "coffee maker", "toaster", "microwave", "oven", "fridge", "refrigerator",
    "mug", "cup", "tumbler", "thermos", "plate", "bowl", "tableware",
    "dinnerware", "ceramic", "porcelain", "glass", "glassware", "candle",
    "vase", "plant pot", "planter", "garden", "outdoor furniture", "patio",
    "sofa", "chair", "table", "desk", "cabinet furniture", "wardrobe", "mirror",
    "wall art", "frame", "lamp", "pet supplies", "pet bed", "pet toy",
  ],
  fashion: [
    "fashion", "textile", "clothing", "apparel", "garment", "shirt", "t-shirt",
    "polo", "blouse", "dress", "skirt", "pants", "trousers", "jeans", "denim",
    "shorts", "leggings", "activewear", "sportswear", "swimwear", "swimsuit",
    "underwear", "lingerie", "sleepwear", "pajama", "fabric", "yarn", "knit",
    "woven", "shoe", "shoes", "sneaker", "footwear", "sandals", "boots",
    "bag", "handbag", "backpack", "wallet", "purse", "luggage", "belt",
    "jewelry", "jewellery", "necklace", "bracelet", "ring", "earring",
    "watch", "sunglasses", "eyewear", "accessory", "hat", "cap", "beanie",
    "scarf", "glove", "sock", "socks", "jacket", "coat", "hoodie", "sweater",
    "suit", "uniform", "workwear", "cotton", "polyester", "silk", "wool",
    "leather", "faux leather", "embroidery", "print on demand", "custom apparel",
  ],
  building: [
    "building", "construction", "renovation", "remodel", "tile", "tiles",
    "fixture", "lighting fixture", "hardware", "door", "window", "flooring",
    "floor tile", "laminate flooring", "vinyl flooring", "hardwood",
    "cement", "concrete", "brick", "roofing", "roof", "gutter", "pipe",
    "plumbing", "faucet", "tap", "valve", "shower", "bathtub", "toilet",
    "sink", "cabinet", "cabinetry", "kitchen cabinet", "countertop",
    "insulation", "drywall", "paint", "coating", "steel", "aluminum",
    "aluminium", "metal fabrication", "sanitary", "sanitary ware",
    "HVAC", "solar panel", "glass curtain wall", "scaffolding", "fastener",
    "screw", "bolt", "nail", "hinge", "lock", "handle", "railing", "fence",
  ],
  packaging: [
    "packaging", "printing", "print", "box", "boxes", "corrugated box",
    "label", "labeling", "carton", "sticker", "decal", "sleeve", "shrink sleeve",
    "pouch", "stand up pouch", "bag packaging", "mailer", "mailer bag",
    "shipping bag", "branding", "custom box", "gift box", "rigid box",
    "tag", "hang tag", "tissue paper", "ribbon", "bubble wrap", "foam insert",
    "blister pack", "clamshell", "cardboard", "kraft paper", "paper bag",
    "tape", "packing tape", "pallet", "crate", "wrapping", "custom packaging",
    "private label packaging",
  ],
  auto: [
    "auto", "automotive", "car", "car parts", "vehicle", "motorcycle", "scooter",
    "e-bike", "electric bike", "bicycle", "bike parts", "tool", "tools",
    "hand tool", "power tool", "wrench", "screwdriver", "hammer", "pliers",
    "tire", "tyre", "wheel", "rim", "engine", "mechanic", "garage equipment",
    "industrial", "industrial equipment", "equipment", "machine", "machinery",
    "cnc", "welding", "welder", "drill", "grinder", "compressor", "generator",
    "hardware tool", "spare part", "spare parts", "auto accessory",
    "car accessory", "dash cam", "car seat cover", "brake pad", "filter",
    "lubricant", "safety equipment", "ppe", "workwear gear", "forklift",
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
