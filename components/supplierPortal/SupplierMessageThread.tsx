"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendMessageAsSupplier, markMessagesReadBySupplier } from "@/lib/actions/supplierMessages";
import type { SupplierMessage } from "@/lib/supabase/types";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted/60 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent";

/** Same shape as the admin's SupplierMessageThread, kept as its own copy
 * since this lives in the public "glass" style system rather than the
 * admin gray theme — same per-file-component convention as this portal's
 * other forms. */
export default function SupplierMessageThread({ messages }: { messages: SupplierMessage[] }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [, startMarkRead] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startMarkRead(() => {
      markMessagesReadBySupplier();
    });
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError("");
    setSending(true);
    try {
      await sendMessageAsSupplier(trimmed);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-strong rounded-2xl p-6 sm:p-8">
      <div className="flex max-h-96 flex-col gap-2 overflow-y-auto">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No messages yet — send one below.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "supplier" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2.5 text-sm ${
                  m.sender === "supplier" ? "bg-accent text-white" : "border border-border bg-surface"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[11px] ${m.sender === "supplier" ? "text-white/70" : "text-muted"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-5 flex items-start gap-2 border-t border-border pt-5">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a message to our team…"
          className={`resize-none ${inputClass}`}
        />
        <button type="button" onClick={handleSend} disabled={sending || !body.trim()} className="btn-primary shrink-0">
          {sending ? "Sending…" : "Send"}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
}
