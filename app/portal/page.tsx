import Link from "next/link";
import {
  Package,
  FileText,
  LogOut,
  MessageCircle,
  Building2,
  Sparkles,
  ClipboardList,
  FileDown,
  Users,
  TrendingUp,
  Globe2,
  ShieldCheck,
  LayoutGrid,
  BookOpen,
  ArrowUpRight,
} from "lucide-react";
import { requirePortalEmail } from "@/lib/portalAuth";
import { getPortalClient, getPortalShipments, getPortalQuoteRequests } from "@/lib/actions/portal";
import { logout } from "@/app/portal/logout/actions";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/shipmentStatus";
import { whatsappLink } from "@/lib/whatsapp";
import ServiceIllustration from "@/components/ServiceIllustration";

export const metadata = {
  robots: { index: false, follow: false },
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Received",
  contacted: "In discussion",
  closed: "Closed",
};

// Every real page/section of the site worth a returning client's time —
// nothing here that isn't already built and live. Kept to one flat list
// rather than split by category, since ten items reads fine as a single
// scan and a taxonomy would be overhead for this few.
const FEATURES = [
  {
    href: "/en/#free-tools",
    icon: Sparkles,
    title: "Free Sourcing Tools",
    desc: "Instant product match, landed-cost calculator, and a document checklist.",
  },
  {
    href: "/en/bulk-quote",
    icon: ClipboardList,
    title: "Bulk RFQ Upload",
    desc: "Send a spreadsheet of items and get one consolidated quote back.",
  },
  {
    href: "/en/suppliers",
    icon: Users,
    title: "Verified Suppliers",
    desc: "Browse factories and suppliers we've vetted on the ground.",
  },
  {
    href: "/en/case-studies",
    icon: TrendingUp,
    title: "Case Studies",
    desc: "Real sourcing projects, with the cost and timeline numbers behind them.",
  },
  {
    href: "/en/shipping",
    icon: Globe2,
    title: "Shipping Routes",
    desc: "Sea, air, and express transit times by destination country.",
  },
  {
    href: "/en/sourcing",
    icon: LayoutGrid,
    title: "Product Categories",
    desc: "What we source, from electronics and home goods to building materials.",
  },
  {
    href: "/en/guide",
    icon: FileDown,
    title: "Sourcing Guide",
    desc: "A free PDF covering MOQs, Incoterms, and inspection basics.",
  },
  {
    href: "/en/security",
    icon: ShieldCheck,
    title: "Trust & Security",
    desc: "How we protect deposits, your data, and every shipment in transit.",
  },
  {
    href: "/en/blog",
    icon: BookOpen,
    title: "Sourcing Guides & Tips",
    desc: "Expert advice on negotiating, quality control, and logistics.",
  },
];

export default async function PortalPage() {
  const email = await requirePortalEmail();
  const [client, shipments, quoteRequests] = await Promise.all([
    getPortalClient(email),
    getPortalShipments(email),
    getPortalQuoteRequests(email),
  ]);

  const inTransitCount = shipments.filter((s) => s.status === "in_transit").length;
  const openQuoteCount = quoteRequests.filter((q) => q.status === "new" || q.status === "contacted").length;

  const stats = [
    { label: "Shipments on file", value: shipments.length, icon: Package },
    { label: "Currently in transit", value: inTransitCount, icon: Globe2 },
    { label: "Open quote requests", value: openQuoteCount, icon: FileText },
  ];

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="eyebrow eyebrow-ruled accent-text text-sm">Client Portal</p>
            <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">
              Welcome back{client?.name ? `, ${client.name.split(" ")[0]}` : ""}
            </h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{email}</span>
              {client?.company && (
                <span className="inline-flex items-center gap-1.5 border-l border-border pl-3">
                  <Building2 size={13} />
                  {client.company}
                </span>
              )}
            </p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium transition hover:bg-surface-2"
            >
              <LogOut size={15} />
              Sign out
            </button>
          </form>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <div key={s.label} className="glass-strong card flex items-center gap-4">
              <ServiceIllustration icon={s.icon} size={44} />
              <div>
                <p className="kpi-value-compact">{s.value}</p>
                <p className="mt-0.5 text-xs font-medium text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        <section className="mt-12">
          <h2 className="font-display text-lg font-semibold">Your Shipments</h2>
          {shipments.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No shipments on file for this email yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {shipments.map((s) => (
                <Link
                  key={s.id}
                  href={`/en/track?number=${encodeURIComponent(s.tracking_number)}`}
                  className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5 transition hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Package size={18} />
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">{s.tracking_number}</p>
                      <p className="text-xs text-muted">
                        {s.destination_country ?? "Destination TBD"}
                        {s.total_pieces ? ` · ${s.total_pieces} pcs` : ""}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${STATUS_COLORS[s.status]}`}
                  >
                    {STATUS_LABELS[s.status]}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="mt-10">
          <h2 className="font-display text-lg font-semibold">Your Quote Requests</h2>
          {quoteRequests.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No quote requests on file for this email yet.</p>
          ) : (
            <div className="mt-4 space-y-3">
              {quoteRequests.map((q) => (
                <div key={q.id} className="glass-strong rounded-2xl p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p className="font-display text-sm font-semibold">{q.product || "General inquiry"}</p>
                        <p className="text-xs text-muted">{new Date(q.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-surface-2 px-3 py-1 text-xs font-semibold text-foreground">
                      {QUOTE_STATUS_LABELS[q.status] ?? q.status}
                    </span>
                  </div>

                  {q.items && q.items.length > 0 && (
                    <div className="mt-4 overflow-x-auto rounded-xl border border-border">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-surface-2 text-left text-muted">
                            <th className="px-3 py-2 font-semibold">Product</th>
                            <th className="px-3 py-2 font-semibold">Quantity</th>
                            <th className="px-3 py-2 font-semibold">Notes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.items.map((item, i) => (
                            <tr key={i} className="border-t border-border">
                              <td className="px-3 py-2">{item.product}</td>
                              <td className="px-3 py-2">{item.quantity || "—"}</td>
                              <td className="px-3 py-2">{item.notes || "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mt-14">
          <p className="eyebrow eyebrow-ruled accent-text text-sm">More From The Unique Choice</p>
          <h2 className="font-display mt-2 text-xl font-semibold">Explore what else we can do for you</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <Link key={f.href} href={f.href} className="glass-strong card group flex items-start gap-4">
                <ServiceIllustration icon={f.icon} size={44} />
                <div className="min-w-0">
                  <p className="font-display flex items-center gap-1.5 text-sm font-semibold">
                    {f.title}
                    <ArrowUpRight
                      size={14}
                      className="shrink-0 text-muted opacity-0 transition-opacity group-hover:opacity-100"
                    />
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <div className="mt-14 flex flex-col items-center gap-4 border-t border-border pt-10 text-center">
          <p className="text-sm text-muted">Need something new sourced, or have a question about an order?</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link href="/en/#consultation" className="btn-primary">
              Request a New Quote
            </Link>
            <a
              href={whatsappLink("Hi! I'm signed in to my client portal and have a question.")}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              <MessageCircle size={16} />
              Message Us on WhatsApp
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
