"use client";

import { useState, useRef, useEffect } from "react";
import { Menu, X, MessageCircle } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Dictionary, Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function HeaderMobileMenu({
  links,
  locale,
  dict,
}: {
  links: { href: string; label: string }[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <>
      <button
        className="flex items-center justify-center rounded p-2 text-foreground transition-colors hover:bg-surface-2 active:bg-border lg:hidden"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle menu"
        aria-expanded={open}
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <div
          ref={menuRef}
          className="absolute left-0 top-full flex w-full flex-col gap-1 border-t border-white/10 bg-brand-navy p-4 lg:hidden"
        >
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded px-3 py-2.5 text-sm font-medium text-white/75 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 flex items-center justify-between gap-3 border-t border-white/10 px-3 pt-3">
            <LanguageSwitcher locale={locale} />
          </div>
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary btn-sm mt-2"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>
      )}
    </>
  );
}
