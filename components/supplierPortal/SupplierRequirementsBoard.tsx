"use client";

import { useMemo, useState, useTransition } from "react";
import { Mail, Phone, MapPin, Calendar, CheckCircle2 } from "lucide-react";
import { expressInterest } from "@/lib/actions/sourcingRequests";
import type { SupplierVisibleSourcingRequest, SourcingCategory } from "@/lib/supabase/types";

export default function SupplierRequirementsBoard({
  requests,
  categories,
}: {
  requests: SupplierVisibleSourcingRequest[];
  categories: SourcingCategory[];
}) {
  const [categoryFilter, setCategoryFilter] = useState("");

  const filtered = useMemo(
    () => (categoryFilter ? requests.filter((r) => r.category_id === categoryFilter) : requests),
    [requests, categoryFilter]
  );

  if (requests.length === 0) {
    return (
      <div className="glass-strong rounded-2xl px-6 py-12 text-center text-sm text-muted">
        No open requirements right now — check back soon.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="rounded-xl border border-border bg-surface px-4 py-2.5 text-sm text-foreground focus:border-accent focus:outline-none"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {filtered.map((r) => (
          <RequirementCard key={r.id} request={r} />
        ))}
      </div>
    </div>
  );
}

function RequirementCard({ request }: { request: SupplierVisibleSourcingRequest }) {
  const [interested, setInterested] = useState(request.already_interested);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function handleInterest() {
    setError("");
    startTransition(async () => {
      const result = await expressInterest(request.id);
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setInterested(true);
    });
  }

  return (
    <div className="glass-strong card flex flex-col gap-3">
      <div className="flex items-center gap-2">
        {request.category_name && (
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-500">{request.category_name}</span>
        )}
        <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[11px] font-medium capitalize text-gray-500">{request.type}</span>
      </div>
      <h3 className="font-display text-base font-semibold leading-snug">{request.title}</h3>
      <p className="line-clamp-3 text-sm text-muted">{request.description}</p>

      <div className="flex flex-wrap gap-3 text-xs text-muted">
        {request.quantity && <span>Qty: {request.quantity}</span>}
        {request.budget_range && <span>Budget: {request.budget_range}</span>}
        {request.destination_country && (
          <span className="flex items-center gap-1">
            <MapPin size={11} />
            {request.destination_country}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Calendar size={11} />
          {new Date(request.created_at).toLocaleDateString()}
        </span>
      </div>

      {interested ? (
        <div className="mt-1 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm">
          <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-emerald-700">
            <CheckCircle2 size={14} />
            You&apos;re interested — contact details
          </p>
          <p className="flex items-center gap-1.5 text-emerald-800">
            <Mail size={12} />
            {request.customer_name} — {request.customer_email}
          </p>
          {request.customer_whatsapp && (
            <p className="mt-1 flex items-center gap-1.5 text-emerald-800">
              <Phone size={12} />
              {request.customer_whatsapp}
            </p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleInterest}
          disabled={isPending}
          className="btn-primary mt-1 w-fit"
        >
          {isPending ? "Sending..." : "I'm interested"}
        </button>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
