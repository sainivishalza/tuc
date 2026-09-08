import Link from "next/link";
import { Package, FileText, LogOut, MessageCircle } from "lucide-react";
import { requirePortalEmail } from "@/lib/portalAuth";
import { getPortalShipments, getPortalQuoteRequests } from "@/lib/actions/portal";
import { logout } from "@/app/portal/logout/actions";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/shipmentStatus";
import { whatsappLink } from "@/lib/whatsapp";

export const metadata = {
  robots: { index: false, follow: false },
};

const QUOTE_STATUS_LABELS: Record<string, string> = {
  new: "Received",
  contacted: "In discussion",
  closed: "Closed",
};

export default async function PortalPage() {
  const email = await requirePortalEmail();
  const [shipments, quoteRequests] = await Promise.all([
    getPortalShipments(email),
    getPortalQuoteRequests(email),
  ]);

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="eyebrow accent-text text-xs sm:text-sm">Client Portal</p>
            <h1 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">Welcome back</h1>
            <p className="mt-1 text-sm text-muted">Signed in as {email}</p>
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

        <section className="mt-10">
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
                <div key={q.id} className="glass-strong flex flex-wrap items-center justify-between gap-3 rounded-2xl p-5">
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
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted">Need something new sourced, or have a question about an order?</p>
          <a
            href={whatsappLink("Hi! I'm signed in to my client portal and have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="brand-gradient flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90"
          >
            <MessageCircle size={16} />
            Message Us on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
