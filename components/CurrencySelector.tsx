"use client";

import { useState, useRef, useEffect } from "react";
import { Coins, ChevronDown } from "lucide-react";
import { CURRENCIES } from "@/lib/currency";
import { useCurrency } from "@/lib/useCurrency";

export default function CurrencySelector() {
  const { currency, setCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm text-foreground/80 transition hover:border-foreground/30 hover:text-foreground"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <Coins size={15} />
        {currency}
        <ChevronDown size={14} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div role="listbox" className="glass-strong absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl py-1">
          {CURRENCIES.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={c.code === currency}
              onClick={() => {
                setCurrency(c.code);
                setOpen(false);
              }}
              className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-surface-2 ${
                c.code === currency ? "font-semibold text-accent" : "text-foreground/80"
              }`}
            >
              {c.symbol} {c.code} — {c.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
