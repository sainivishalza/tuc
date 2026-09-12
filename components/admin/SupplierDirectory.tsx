"use client";

import { useMemo, useState } from "react";
import { Search, Star, MapPin, FileCheck2, ShieldCheck } from "lucide-react";
import type { Supplier } from "@/lib/supabase/types";
import { updateSupplierRating } from "@/lib/actions/suppliers";
import { Badge, EmptyState, LinkButton, inputClass, type BadgeTone } from "@/components/admin/ui";

const STATUS_TONE: Record<Supplier["status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "neutral",
};

export default function SupplierDirectory({ suppliers }: { suppliers: Supplier[] }) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Supplier["status"] | "all">("all");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      return (
        s.company_name.toLowerCase().includes(q) ||
        (s.country ?? "").toLowerCase().includes(q) ||
        (s.product_categories ?? "").toLowerCase().includes(q)
      );
    });
  }, [suppliers, search, statusFilter]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, country, category…"
            className={`${inputClass} py-2 pl-9`}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as Supplier["status"] | "all")}
          className={`${inputClass} w-auto py-2`}
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ShieldCheck}>No suppliers match your filters.</EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((s) => (
            <SupplierCard key={s.id} supplier={s} />
          ))}
        </div>
      )}
    </div>
  );
}

function SupplierCard({ supplier: s }: { supplier: Supplier }) {
  const [rating, setRating] = useState(s.rating);
  const [saving, setSaving] = useState(false);
  const docCount = [s.business_license_url, s.visiting_card_url, s.company_photo_url].filter(Boolean).length;

  async function handleRate(n: number) {
    const next = rating === n ? null : n;
    setRating(next);
    setSaving(true);
    try {
      await updateSupplierRating(s.id, next);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 transition hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-admin-display truncate text-sm font-semibold text-gray-900">{s.company_name}</p>
          <p className="truncate text-xs text-gray-500">{s.contact_name}</p>
        </div>
        <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
      </div>

      <div className="flex items-center gap-1.5 text-xs text-gray-500">
        <MapPin size={12} className="text-gray-400" />
        {s.country || "Country not set"}
      </div>

      {s.product_categories && (
        <p className="line-clamp-2 text-xs text-gray-500">{s.product_categories}</p>
      )}

      <div className="flex items-center gap-0.5" aria-label={rating ? `${rating} out of 5 stars` : "Not yet rated"}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={saving}
            onClick={() => handleRate(n)}
            aria-label={`Rate ${n} star${n === 1 ? "" : "s"}`}
            className="disabled:opacity-50"
          >
            <Star
              size={15}
              className={rating && n <= rating ? "fill-amber-400 text-amber-400" : "text-gray-300"}
            />
          </button>
        ))}
      </div>

      <div className="flex items-center justify-between border-t border-gray-100 pt-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <FileCheck2 size={12} />
          {docCount} document{docCount === 1 ? "" : "s"} on file
        </span>
        <LinkButton href={`/admin/suppliers/${s.id}`} variant="secondary" size="sm">
          Edit
        </LinkButton>
      </div>
    </div>
  );
}
