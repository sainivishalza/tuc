"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function ReferralLinkBox({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browsers, non-HTTPS) —
      // the link is still shown selectable as plain text either way.
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3">
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{link}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="flex shrink-0 items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium transition hover:bg-surface-2"
      >
        {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
