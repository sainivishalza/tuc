"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users } from "lucide-react";
import type { AdminClient, QuoteRequest } from "@/lib/supabase/types";
import { getQuoteRequestsByEmail, getClientNote, upsertClientNote } from "@/lib/actions/quoteRequests";
import { Badge, Button, EmptyState, inputClass } from "@/components/admin/ui";
import Modal from "@/components/admin/Modal";

function formatMoney(value: number | null): string {
  if (!value) return "—";
  return `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

export default function ClientsTable({ clients }: { clients: AdminClient[] }) {
  const [search, setSearch] = useState("");
  const [active, setActive] = useState<AdminClient | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [clients, search]);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative max-w-sm">
        <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search clients…"
          className={`${inputClass} py-2 pl-9`}
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={Users}>No clients match your search.</EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                  <th className="px-4 py-3">Client</th>
                  <th className="px-3 py-3">Quotes</th>
                  <th className="px-3 py-3">Won value</th>
                  <th className="px-3 py-3">Last contact</th>
                  <th className="px-3 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.email}
                    className="cursor-pointer border-b border-gray-50 transition hover:bg-gray-50 last:border-b-0"
                    onClick={() => setActive(c)}
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </td>
                    <td className="px-3 py-3 text-gray-600">{c.quote_count}</td>
                    <td className="px-3 py-3 font-medium text-gray-900">{formatMoney(c.total_won_value)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-gray-500">
                      {new Date(c.last_quote_at).toLocaleDateString()}
                    </td>
                    <td className="px-3 py-3">
                      {c.has_open_quote ? (
                        <Badge tone="warning">Open quote</Badge>
                      ) : (
                        <Badge tone="neutral">No open quote</Badge>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active && <ClientDetailModal client={active} onClose={() => setActive(null)} />}
    </div>
  );
}

function ClientDetailModal({ client, onClose }: { client: AdminClient; onClose: () => void }) {
  const [quotes, setQuotes] = useState<QuoteRequest[] | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  useEffect(() => {
    getQuoteRequestsByEmail(client.email).then(setQuotes);
    getClientNote(client.email).then((n) => setNotes(n?.notes ?? ""));
  }, [client.email]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    await upsertClientNote(client.email, notes);
    setSavingNotes(false);
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  return (
    <Modal open onClose={onClose} title={client.name} size="lg">
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div>
            <p className="text-xs font-semibold text-gray-500">Email</p>
            <p className="text-gray-800">{client.email}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">WhatsApp</p>
            <p className="text-gray-800">{client.whatsapp || "—"}</p>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500">Total won value</p>
            <p className="text-gray-800">{formatMoney(client.total_won_value)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Order history</p>
          {quotes === null ? (
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-gray-100" />
              ))}
            </div>
          ) : quotes.length === 0 ? (
            <p className="text-sm text-gray-400">No quotes on file.</p>
          ) : (
            <div className="flex flex-col divide-y divide-gray-100 overflow-hidden rounded-lg border border-gray-100">
              {quotes.map((q) => (
                <div key={q.id} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
                  <div className="min-w-0">
                    <p className="truncate text-gray-800">{q.product || "General inquiry"}</p>
                    <p className="text-xs text-gray-400">{new Date(q.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-xs font-medium text-gray-600">{formatMoney(q.quoted_value)}</span>
                    <Badge tone="neutral">{q.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-gray-400">
            Internal notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Anything worth remembering about this client…"
            className={`resize-none ${inputClass}`}
          />
          <div className="mt-2 flex items-center gap-3">
            <Button size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? "Saving…" : "Save notes"}
            </Button>
            {notesSaved && <span className="text-xs text-emerald-600">Saved</span>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
