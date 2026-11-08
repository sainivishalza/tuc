import type { SupplierProduct } from "@/lib/supabase/types";

const CLASSES: Record<SupplierProduct["stock_status"], string> = {
  in_stock: "bg-emerald-100 text-emerald-700",
  made_to_order: "bg-blue-100 text-blue-700",
  out_of_stock: "bg-gray-200 text-gray-500",
};

export interface StockStatusLabels {
  in_stock: string;
  made_to_order: string;
  out_of_stock: string;
}

/** Labels come from the caller's own dictionary slice rather than being
 * hardcoded here — this renders on public, trilingual pages (the catalog
 * board and product detail), so the label has to translate like every
 * other string on those pages. */
export default function StockStatusBadge({ status, labels }: { status: SupplierProduct["stock_status"]; labels: StockStatusLabels }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CLASSES[status]}`}>
      {labels[status]}
    </span>
  );
}
