import Link from "next/link";
import { LayoutDashboard, LogOut } from "lucide-react";
import { adminFeatures } from "@/lib/admin-features";
import { logout } from "@/app/admin/logout/actions";

/**
 * Persistent sidebar shell for every gated admin page. Replaces the
 * "← Admin" back-link + hand-rolled header each page used to repeat on
 * its own, with real navigation that doesn't force a trip back to the
 * dashboard between sections.
 *
 * `current` is passed explicitly by each page rather than read from the
 * URL server-side, since that's a plain, reliable way to highlight the
 * active item without depending on request-header sniffing.
 */
export default function AdminShell({
  current,
  children,
}: {
  current: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <aside className="shrink-0 border-b border-gray-800 bg-brand-950 lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:border-b-0 lg:border-r">
        <div className="flex h-full flex-col px-4 py-5 lg:px-5 lg:py-6">
          <Link href="/admin" className="flex items-center gap-2.5 px-1">
            <span className="gradient-brand flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-admin-display text-sm font-semibold text-white">
              U
            </span>
            <span className="font-admin-display text-sm font-semibold text-white">
              The Unique Choice
              <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40">
                Admin
              </span>
            </span>
          </Link>

          <nav className="mt-6 flex flex-1 flex-col gap-0.5 overflow-y-auto">
            <NavLink href="/admin" active={current === "/admin"} icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            {adminFeatures
              .filter((f) => f.status === "live" && f.href.startsWith("/admin/"))
              .map((f) => (
                <NavLink key={f.href} href={f.href} active={current === f.href} icon={f.icon}>
                  {f.title}
                </NavLink>
              ))}
          </nav>

          <form action={logout} className="mt-4 border-t border-white/10 pt-4">
            <button
              type="submit"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-white/60 transition hover:bg-white/5 hover:text-white"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-6">{children}</div>
      </main>
    </div>
  );
}

function NavLink({
  href,
  active,
  icon: Icon,
  children,
}: {
  href: string;
  active: boolean;
  icon: React.ComponentType<{ size?: number }>;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Icon size={16} />
      {children}
    </Link>
  );
}
