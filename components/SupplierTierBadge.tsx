import { Crown, Medal } from "lucide-react";
import type { Supplier } from "@/lib/supabase/types";

/** Nothing rendered for "standard" — the Verified badge already covers
 * the baseline; this only adds visual distinction once an admin has
 * actually judged a supplier gold/premium-worthy. */
export default function SupplierTierBadge({ tier }: { tier: Supplier["tier"] }) {
  if (tier === "premium") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-indigo-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-indigo-700">
        <Crown size={11} />
        Premium
      </span>
    );
  }
  if (tier === "gold") {
    return (
      <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-700">
        <Medal size={11} />
        Gold
      </span>
    );
  }
  return null;
}
