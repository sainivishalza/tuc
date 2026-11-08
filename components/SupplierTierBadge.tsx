import { Crown, Medal } from "lucide-react";
import type { Supplier } from "@/lib/supabase/types";

export interface SupplierTierLabels {
  gold: string;
  premium: string;
}

/** Nothing rendered for "standard" — the Verified badge already covers
 * the baseline; this only adds visual distinction once an admin has
 * actually judged a supplier gold/premium-worthy. Labels come from the
 * caller's dictionary slice since this renders on public, trilingual
 * pages (the directory and a supplier's own profile). */
export default function SupplierTierBadge({ tier, labels }: { tier: Supplier["tier"]; labels: SupplierTierLabels }) {
  if (tier === "premium") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
        <Crown size={11} />
        {labels.premium}
      </span>
    );
  }
  if (tier === "gold") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <Medal size={11} />
        {labels.gold}
      </span>
    );
  }
  return null;
}
