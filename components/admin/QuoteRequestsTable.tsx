"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import type { QuoteRequest } from "@/lib/supabase/types";
import {
  updateQuoteRequestStatus,
  updateQuoteValue,
  bulkUpdateQuoteStatus,
} from "@/lib/actions/quoteRequests";
import { Badge, Button, EmptyState, inputClass, type BadgeTone } from "@/components/admin/ui";
import Modal from "@/components/admin/Modal";

const STATUS_LABEL: Record<QuoteRequest["status"], string> = {
  new: "Pending",
  contacted: "In Progress",
  closed: "Complete",
  lost: "Failed",
};
const STATUS_TONE: Record<QuoteRequest["status"], BadgeTone> = {
  new: "warning",
  contacted: "info",
  closed: "success",
  lost: "danger",
};
const ALL_STATUSES = Object.keys(STATUS_LABEL) as QuoteRequest["status"][];
const PAGE_SIZE = 10;

function formatMoney(value: number | null): string {
  if (value === null) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function QuoteRequestsTable({ requests }: { requests: QuoteRequest[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<QuoteRequest["status"] | "all">("all");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [active, setActive] = useState<QuoteRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return requests.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (!q) return true;
      return (
        r.name.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        (r.product ?? "").toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
      );
    });
  }, [requests, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleAllOnPage() {
    const pageIds = pageItems.map((r) => r.id);
    const allSelected = pageIds.every((id) => selected.has(id));
    setSelected((prev) => {
      const next = new Set(prev);
      pageIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function runBulk(status: QuoteRequest["status"]) {
    const ids = Array.from(selected);
    startTransition(async () => {
      await bulkUpdateQuoteStatus(ids, status);
      setSelected(new Set());
      router.refresh();
    });
  }

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
            placeholder="Search by name, email, product…"
            className={`${inputClass} py-2 pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as QuoteRequest["status"] | "all");
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

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-2.5">
          <span className="text-sm font-medium text-gray-700">{selected.size} selected</span>
          <div className="ml-auto flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <Button key={s} size="sm" variant="secondary" disabled={isPending} onClick={() => runBulk(s)}>
                Mark {STATUS_LABEL[s]}
              </Button>
            ))}
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon={MessageCircle}>No quote requests match your filters.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="w-10 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={pageItems.length > 0 && pageItems.every((r) => selected.has(r.id))}
                      onChange={toggleAllOnPage}
                      className="h-4 w-4 rounded accent-accent"
                    />
                  </th>
                  <th className="px-3 py-3">Quote ID</th>
                  <th className="px-3 py-3">Client</th>
                  <th className="px-3 py-3">Product</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Value</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((r) => (
                  <tr
                    key={r.id}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 last:border-b-0"
                    onClick={() => setActive(r)}
                  >
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected.has(r.id)}
                        onChange={() => toggleOne(r.id)}
                        className="h-4 w-4 rounded accent-accent"
                      />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-gray-400">{r.id.slice(0, 8)}</td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="max-w-[180px] truncate px-3 py-3 text-gray-600">{r.product || "—"}</td>
                    <td className="px-3 py-3">
                      <Badge tone={STATUS_TONE[r.status]}>{STATUS_LABEL[r.status]}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {new Date(r.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3 font-medium text-gray-900">{formatMoney(r.quoted_value)}</td>
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
              <Button
                size="icon"
                variant="ghost"
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft size={15} />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-label="Next page"
              >
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        </div>
      )}

      {active && (
        <QuoteDetailModal
          quote={active}
          onClose={() => {
            setActive(null);
            router.refresh();
          }}
        />
      )}
    </div>
  );
}

function QuoteDetailModal({ quote, onClose }: { quote: QuoteRequest; onClose: () => void }) {
  const [status, setStatus] = useState(quote.status);
  const [value, setValue] = useState(quote.quoted_value !== null ? String(quote.quoted_value) : "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setSaving(true);
    await Promise.all([
      status !== quote.status ? updateQuoteRequestStatus(quote.id, status) : Promise.resolve(),
      value.trim() !== (quote.quoted_value?.toString() ?? "")
        ? updateQuoteValue(quote.id, value.trim() ? Number(value) : null)
        : Promise.resolve(),
    ]);
    setSaving(false);
    onClose();
  }

  return (
    <Modal open onClose={onClose} title={quote.name} size="md">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Info label="Email" value={quote.email} />
          <Info label="WhatsApp" value={quote.whatsapp || "—"} />
          <Info label="Product" value={quote.product || "—"} />
          <Info label="Quantity" value={quote.quantity || "—"} />
          <Info label="Timeline" value={quote.timeline || "—"} />
          <Info label="Submitted" value={new Date(quote.created_at).toLocaleString()} />
        </div>

        {quote.message && (
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">Message</p>
            <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700">{quote.message}</p>
          </div>
        )}

        {quote.items && quote.items.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-semibold text-gray-500">Line items</p>
            <div className="overflow-hidden rounded-lg border border-gray-100">
              <table className="w-full text-xs">
                <tbody>
                  {quote.items.map((item, i) => (
                    <tr key={i} className="border-t border-gray-100 first:border-t-0">
                      <td className="px-3 py-2 font-medium text-gray-700">{item.product}</td>
                      <td className="px-3 py-2 text-gray-500">{item.quantity || "—"}</td>
                      <td className="px-3 py-2 text-gray-500">{item.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteRequest["status"])}
              className={inputClass}
            >
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-gray-700">Quoted value ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Not priced yet"
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-500">{label}</p>
      <p className="text-gray-800">{value}</p>
    </div>
  );
}
