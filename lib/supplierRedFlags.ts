// Free, static supplier red-flags checklist — no external API. Encodes
// the same warning signs a sourcing agent watches for before recommending
// a factory, so a buyer evaluating a supplier they found on their own can
// run the same check themselves.

export interface RedFlagContent {
  label: string;
  explanation: string;
}

export interface RedFlagItem extends RedFlagContent {
  id: string;
  severity: "high" | "medium";
}

const RED_FLAG_SEVERITY: Record<string, RedFlagItem["severity"]> = {
  personal_account: "high",
  no_business_license: "high",
  price_too_good: "medium",
  no_video_call: "medium",
  pressure_full_payment: "high",
  no_samples: "medium",
  inconsistent_details: "high",
};

export const RED_FLAG_IDS = Object.keys(RED_FLAG_SEVERITY);

export function getRedFlags(content: Record<string, RedFlagContent>): RedFlagItem[] {
  return RED_FLAG_IDS.map((id) => ({ id, severity: RED_FLAG_SEVERITY[id], ...content[id] }));
}

export interface VerdictContent {
  headline: string;
  message: string;
}

export interface RedFlagVerdict extends VerdictContent {
  level: "clear" | "caution" | "stop";
}

export function getRedFlagVerdict(
  checkedIds: string[],
  flags: RedFlagItem[],
  verdicts: { clear: VerdictContent; stop: VerdictContent; caution: VerdictContent }
): RedFlagVerdict {
  if (checkedIds.length === 0) {
    return { level: "clear", ...verdicts.clear };
  }

  const checkedItems = flags.filter((f) => checkedIds.includes(f.id));
  const hasHigh = checkedItems.some((f) => f.severity === "high");

  if (hasHigh) {
    return { level: "stop", ...verdicts.stop };
  }

  return { level: "caution", ...verdicts.caution };
}
