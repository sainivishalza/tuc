"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Menu, X, MessageCircle } from "lucide-react";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Dictionary } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { whatsappLink } from "@/lib/whatsapp";

export default function Header({
  dict,
  locale,
}: {
  dict: Dictionary;
  locale: Locale;
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

  const links = [
    { href: `/${locale}#services`, label: dict.nav.services },
    { href: `/${locale}#pricing`, label: dict.nav.pricing },
    { href: `/${locale}#how-it-works`, label: dict.nav.howItWorks },
    { href: `/${locale}#why-us`, label: dict.nav.whyUs },
    { href: `/${locale}#faq`, label: dict.nav.faq },
    { href: `/${locale}/sourcing`, label: dict.categories.title },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/track`, label: dict.nav.trackShipment },
    { href: "/portal/login", label: "Client Login" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-navy shadow-lg shadow-black/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3.5 sm:px-6">
        <Link href={`/${locale}`} className="flex items-center gap-2.5">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg font-display text-base font-semibold text-white">
            U
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-white sm:text-lg">
            <span className="text-accent">The Unique</span> Choice
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="group relative text-sm font-medium text-white/70 transition hover:text-white"
            >
              {l.label}
              <span className="absolute -bottom-1 left-0 h-0.5 w-0 rounded-full bg-accent transition-all duration-300 group-hover:w-full" />
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSwitcher locale={locale} />
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient-animated flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-white shadow-md shadow-black/20 transition hover:scale-105"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>

        <button
          className="flex items-center justify-center rounded-full p-2 text-white lg:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div ref={menuRef} className="flex flex-col gap-1 border-t border-white/10 bg-brand-navy p-4 lg:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
            >
              {l.label}
            </a>
          ))}
          <div className="mt-1 flex items-center justify-between gap-3 px-3 pt-2">
            <LanguageSwitcher locale={locale} />
          </div>
          <a
            href={whatsappLink(dict.contact.whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient-animated mt-2 flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-semibold text-white"
          >
            <MessageCircle size={16} />
            {dict.nav.chatWhatsapp}
          </a>
        </div>
      )}
    </header>
  );
}
