"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Package } from "lucide-react";
import type { AdminSourcingRequest, SourcingRequestStatus } from "@/lib/supabase/types";
import { Badge, EmptyState, inputClass, type BadgeTone } from "@/components/admin/ui";

const STATUS_LABEL: Record<SourcingRequestStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
  closed: "Closed",
};
const STATUS_TONE: Record<SourcingRequestStatus, BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  closed: "neutral",
};
const ALL_STATUSES = Object.keys(STATUS_LABEL) as SourcingRequestStatus[];
const PAGE_SIZE = 10;

export default function SourcingRequestsTable({ requests }: { requests: AdminSourcingRequest[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<SourcingRequestStatus | "all">("all");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return r.title.toLowerCase().includes(q) || r.customer_name.toLowerCase().includes(q) || r.customer_email.toLowerCase().includes(q);
    });
  }, [requests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, name, email…"
            className={`${inputClass} py-2 pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as SourcingRequestStatus | "all");
            setPage(1);
          }}
          className={`${inputClass} w-auto py-2`}
        >
          <option value="all">All statuses</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Package}>No sourcing requests match your filters.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Title</th>
                  <th className="px-3 py-3">Customer</th>
                  <th className="px-3 py-3">Category</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Interest</th>
                  <th className="px-3 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 last:border-b-0"
                    onClick={() => router.push(`/admin/sourcing-requests/${r.id}`)}
                  >
                    <td className="max-w-[220px] px-4 py-3">
                      <p className="truncate font-medium text-gray-900">{r.title}</p>
                      {r.source === "promoted_from_quote" && <p className="text-[11px] text-gray-400">Promoted from quote request</p>}
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-gray-700">{r.customer_name}</p>
                      <p className="text-xs text-gray-400">{r.customer_email}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{r.category_name || "—"}</td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{r.interest_count} supplier{r.interest_count === 1 ? "" : "s"}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">{new Date(r.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span>
              {filtered.length} result{filtered.length === 1 ? "" : "s"} — page {page} of {totalPages}
            </span>
            <div className="flex gap-1">
              <button type="button" disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="disabled:opacity-40">
                Prev
              </button>
              <span className="px-1">/</span>
              <button type="button" disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="disabled:opacity-40">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
