"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { MessageSquare } from "lucide-react";
import { sendMessageAsAdmin, markMessagesReadByAdmin } from "@/lib/actions/supplierMessages";
import type { SupplierMessage } from "@/lib/supabase/types";
import { Button, inputClass } from "@/components/admin/ui";

export default function SupplierMessageThread({ supplierId, messages }: { supplierId: string; messages: SupplierMessage[] }) {
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [, startMarkRead] = useTransition();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startMarkRead(() => {
      markMessagesReadByAdmin(supplierId);
    });
  }, [supplierId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = body.trim();
    if (!trimmed) return;
    setError("");
    setSending(true);
    try {
      await sendMessageAsAdmin(supplierId, trimmed);
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div>
      <h3 className="font-admin-display flex items-center gap-1.5 text-sm font-semibold text-gray-900">
        <MessageSquare size={14} />
        Messages
      </h3>
      <p className="mt-1 text-xs text-gray-500">An in-platform alternative to email or WhatsApp — the supplier sees this in their portal.</p>

      <div className="mt-3 flex max-h-80 flex-col gap-2 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50 p-3">
        {messages.length === 0 ? (
          <p className="py-6 text-center text-xs text-gray-400">No messages yet.</p>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "admin" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                  m.sender === "admin" ? "bg-accent text-white" : "border border-gray-200 bg-white text-gray-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{m.body}</p>
                <p className={`mt-1 text-[10px] ${m.sender === "admin" ? "text-white/70" : "text-gray-400"}`}>
                  {new Date(m.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-start gap-2">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={2}
          placeholder="Write a message…"
          className={`resize-none ${inputClass}`}
        />
        <Button size="sm" onClick={handleSend} disabled={sending || !body.trim()}>
          {sending ? "Sending…" : "Send"}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
