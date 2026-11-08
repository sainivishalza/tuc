import type { SupplierProduct } from "@/lib/supabase/types";

const LABELS: Record<SupplierProduct["stock_status"], string> = {
  in_stock: "In stock",
  made_to_order: "Made to order",
  out_of_stock: "Out of stock",
};

const CLASSES: Record<SupplierProduct["stock_status"], string> = {
  in_stock: "bg-emerald-100 text-emerald-700",
  made_to_order: "bg-blue-100 text-blue-700",
  out_of_stock: "bg-gray-200 text-gray-500",
};

export default function StockStatusBadge({ status }: { status: SupplierProduct["stock_status"] }) {
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${CLASSES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
