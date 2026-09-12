"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { LayoutDashboard, LogOut, ChevronsLeft, ChevronsRight } from "lucide-react";
import { adminFeatures } from "@/lib/admin-features";
import { logout } from "@/app/admin/logout/actions";

const COLLAPSE_KEY = "tuc-admin-sidebar-collapsed";

export default function Sidebar({ current }: { current: string }) {
  // Read the persisted preference after mount only — rendering collapsed
  // on the server (or on first paint) would flash from expanded to
  // collapsed for anyone who'd chosen collapsed, which is worse than a
  // one-frame default. Simpler to accept that one frame than to fight
  // hydration mismatches over a purely cosmetic preference.
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    // Deliberate read-from-localStorage-on-mount, not a case the "don't
    // setState in an effect" rule is meant to catch — this can't be
    // derived during render since localStorage isn't available during
    // SSR; a lazy useState initializer would read it during hydration
    // instead and cause a mismatch against the server-rendered markup.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCollapsed(localStorage.getItem(COLLAPSE_KEY) === "1");
  }, []);

  function toggleCollapsed() {
    setCollapsed((v) => {
      localStorage.setItem(COLLAPSE_KEY, v ? "0" : "1");
      return !v;
    });
  }

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    ...adminFeatures
      .filter((f) => f.status === "live" && f.href.startsWith("/admin/"))
      .map((f) => ({ href: f.href, label: f.title, icon: f.icon })),
  ];

  return (
    <>
      {/* Mobile top strip: logo + hamburger, sidebar itself becomes an
          overlay drawer below lg. */}
      <div className="flex items-center justify-between border-b border-gray-800 bg-brand-950 px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2.5">
          <span className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-admin-display text-sm font-semibold text-white">
            U
          </span>
          <span className="font-admin-display text-sm font-semibold text-white">The Unique Choice</span>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Toggle navigation"
          className="rounded-lg p-2 text-white/70 hover:bg-white/5 hover:text-white"
        >
          {mobileOpen ? <ChevronsLeft size={18} /> : <ChevronsRight size={18} />}
        </button>
      </div>

      <aside
        className={`shrink-0 bg-brand-950 transition-[width] duration-200 lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-gray-800 ${
          collapsed ? "lg:w-[72px]" : "lg:w-64"
        } ${mobileOpen ? "block" : "hidden"} lg:block`}
      >
        <div className="flex h-full flex-col px-3 py-5 lg:px-3.5 lg:py-6">
          <Link href="/admin" className={`hidden items-center gap-2.5 px-1 lg:flex ${collapsed ? "justify-center" : ""}`}>
            <span className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-admin-display text-sm font-semibold text-white">
              U
            </span>
            {!collapsed && (
              <span className="font-admin-display text-sm font-semibold whitespace-nowrap text-white">
                The Unique Choice
                <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">Admin</span>
              </span>
            )}
          </Link>

          <nav className="mt-2 flex flex-1 flex-col gap-0.5 overflow-y-auto lg:mt-6">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                active={current === item.href}
                icon={item.icon}
                collapsed={collapsed}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-4 flex flex-col gap-1 border-t border-white/10 pt-4">
            <form action={logout}>
              <button
                type="submit"
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white ${
                  collapsed ? "justify-center px-0" : ""
                }`}
              >
                <LogOut size={16} />
                {!collapsed && "Sign out"}
              </button>
            </form>
            <button
              type="button"
              onClick={toggleCollapsed}
              className={`hidden items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/40 transition hover:bg-white/5 hover:text-white lg:flex ${
                collapsed ? "justify-center px-0" : ""
              }`}
            >
              {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
              {!collapsed && "Collapse"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  collapsed,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number }>;
  collapsed: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      title={collapsed ? String(children) : undefined}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition ${
        collapsed ? "justify-center px-0" : ""
      } ${active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"}`}
    >
      <Icon size={16} />
      {!collapsed && children}
    </Link>
  );
}
