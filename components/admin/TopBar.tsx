"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, Bell, User, LogOut, Palette } from "lucide-react";
import { adminFeatures } from "@/lib/admin-features";
import { logout } from "@/app/admin/logout/actions";

interface NotificationItem {
  label: string;
  count: number;
  href: string;
}

/**
 * Search here is quick navigation across the admin's own sections
 * (matching Linear/Vercel's cmd-K pattern) rather than a full-text
 * search over quotes/suppliers/clients — there's no unified search
 * index behind this panel, and pretending otherwise would be worse than
 * being upfront about what it does.
 */
export default function TopBar({ notifications }: { notifications: NotificationItem[] }) {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) setAccountOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const results = query.trim()
    ? adminFeatures.filter((f) => f.title.toLowerCase().includes(query.trim().toLowerCase()))
    : [];

  const totalNotifications = notifications.reduce((sum, n) => sum + n.count, 0);

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-gray-200 bg-white/90 px-4 py-3 backdrop-blur-sm sm:px-6">
      <div ref={searchRef} className="relative w-full max-w-sm">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setSearchOpen(true)}
          placeholder="Jump to a section…"
          className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-accent focus:bg-white focus:outline-none focus:ring-1 focus:ring-accent"
        />
        {searchOpen && query.trim() && (
          <div className="absolute left-0 top-full mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {results.length === 0 ? (
              <p className="px-3.5 py-3 text-xs text-gray-400">No matching section.</p>
            ) : (
              results.slice(0, 6).map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  onClick={() => {
                    setQuery("");
                    setSearchOpen(false);
                  }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                >
                  <r.icon size={14} className="text-gray-400" />
                  {r.title}
                </Link>
              ))
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen((v) => !v)}
            aria-label="Notifications"
            className="relative flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Bell size={17} />
            {totalNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-2 w-2 rounded-full bg-accent" />
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="font-admin-display text-sm font-semibold text-gray-900">Needs attention</p>
              </div>
              {totalNotifications === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-gray-400">All caught up.</p>
              ) : (
                <div className="flex flex-col divide-y divide-gray-100">
                  {notifications
                    .filter((n) => n.count > 0)
                    .map((n) => (
                      <Link
                        key={n.href}
                        href={n.href}
                        onClick={() => setNotifOpen(false)}
                        className="flex items-center justify-between px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {n.label}
                        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent/15 px-1.5 text-xs font-bold text-brand-900">
                          {n.count}
                        </span>
                      </Link>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div ref={accountRef} className="relative">
          <button
            type="button"
            onClick={() => setAccountOpen((v) => !v)}
            aria-label="Account menu"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-900 text-white transition hover:opacity-90"
          >
            <User size={15} />
          </button>
          {accountOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
              <Link
                href="/admin/theme"
                onClick={() => setAccountOpen(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Palette size={14} className="text-gray-400" />
                Theme settings
              </Link>
              <form action={logout}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50"
                >
                  <LogOut size={14} className="text-gray-400" />
                  Sign out
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
