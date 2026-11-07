"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, PackageX } from "lucide-react";
import type { AdminSupplierProduct } from "@/lib/actions/supplierProducts";
import { Badge, EmptyState, inputClass } from "@/components/admin/ui";

export default function ProductsTable({ products, initialSearch = "" }: { products: AdminSupplierProduct[]; initialSearch?: string }) {
  const router = useRouter();
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.supplier_company_name.toLowerCase().includes(q) ||
        (p.category_name ?? "").toLowerCase().includes(q)
      );
    });
  }, [products, search, statusFilter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, supplier, or category…"
            className={`${inputClass} py-2 pl-9`}
          />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className={`${inputClass} w-auto py-2`}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={PackageX}>No products match your filters.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Product</th>
                  <th className="px-3 py-3">Supplier</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">From price</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => {
                  const low = p.price_tiers.length > 0 ? Math.min(...p.price_tiers.map((t) => t.price)) : null;
                  return (
                    <tr
                      key={p.id}
                      className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 last:border-b-0"
                      onClick={() => router.push(`/admin/products/${p.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {p.image_urls[0] ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.image_urls[0]} alt="" className="h-8 w-8 rounded-md object-cover" />
                          ) : (
                            <span className="flex h-8 w-8 items-center justify-center rounded-md bg-gray-100 text-gray-400">
                              <PackageX size={14} />
                            </span>
                          )}
                          <Link href={`/admin/products/${p.id}`} className="font-medium text-gray-900 hover:underline" onClick={(e) => e.stopPropagation()}>
                            {p.title}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-gray-600">{p.supplier_company_name}</td>
                      <td className="px-3 py-3 text-gray-500">{p.category_name ?? "—"}</td>
                      <td className="px-3 py-3 font-medium text-gray-900">{low !== null ? `$${low}${p.price_unit ? ` / ${p.price_unit}` : ""}` : "—"}</td>
                      <td className="px-3 py-3">
                        <Badge tone={p.status === "active" ? "success" : "neutral"}>{p.status}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
