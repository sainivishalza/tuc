import { getActiveQuoteCount } from "@/lib/actions/quoteRequests";
import { getPendingSupplierCount } from "@/lib/actions/suppliers";
import Sidebar from "@/components/admin/Sidebar";
import TopBar from "@/components/admin/TopBar";

/**
 * Persistent shell for every gated admin page: a collapsible sidebar,
 * a top bar with quick-nav search and real "needs attention" counts,
 * and the page content itself. `current` is passed explicitly by each
 * page rather than read from the URL server-side, since that's a plain,
 * reliable way to highlight the active item without depending on
 * request-header sniffing.
 */
export default async function AdminShell({
  current,
  children,
  fullWidth = false,
}: {
  current: string;
  children: React.ReactNode;
  /** Escapes the default max-w-6xl content width — for screens like the
   * order-tracking Kanban board where extra columns should be visible
   * before falling back to horizontal scroll, not squeezed into a
   * text-content-width column first. */
  fullWidth?: boolean;
}) {
  const [activeQuotes, pendingSuppliers] = await Promise.all([
    getActiveQuoteCount(),
    getPendingSupplierCount(),
  ]);

  const notifications = [
    { label: "New quote requests", count: activeQuotes, href: "/admin/quote-requests" },
    { label: "Suppliers awaiting review", count: pendingSuppliers, href: "/admin/suppliers" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 lg:flex">
      <Sidebar current={current} />

      <div className="min-w-0 flex-1">
        <TopBar notifications={notifications} />
        <main className="px-4 py-8 sm:px-8 sm:py-10 lg:px-10">
          <div className={`mx-auto flex flex-col gap-6 ${fullWidth ? "" : "max-w-6xl"}`}>{children}</div>
        </main>
      </div>
    </div>
  );
}
