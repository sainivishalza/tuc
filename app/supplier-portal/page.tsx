import Link from "next/link";
import {
  Building2,
  LogOut,
  MessageCircle,
  MapPin,
  Star,
  Tags,
  Users,
  ShieldCheck,
  Info,
  LayoutGrid,
  Pencil,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierBySelf } from "@/lib/actions/supplierPortal";
import { logout } from "@/app/supplier-portal/logout/actions";
import { whatsappLink } from "@/lib/whatsapp";
import ServiceIllustration from "@/components/ServiceIllustration";
import type { Supplier } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const STATUS_CONTENT: Record<Supplier["status"], { icon: typeof Clock; label: string; desc: string; classes: string }> = {
  pending: {
    icon: Clock,
    label: "Application under review",
    desc: "Our team typically reviews new suppliers within a few business days. We'll email you the moment there's an update.",
    classes: "bg-amber-100 text-amber-700",
  },
  approved: {
    icon: CheckCircle2,
    label: "You're a Verified Supplier",
    desc: "Your listing is live in our public Verified Suppliers directory.",
    classes: "bg-emerald-100 text-emerald-700",
  },
  rejected: {
    icon: XCircle,
    label: "Application not approved",
    desc: "Message us on WhatsApp if you'd like to discuss this or submit an updated application.",
    classes: "bg-red-100 text-red-700",
  },
};

// Real, already-built pages relevant to a supplier's relationship with the
// business — not the client-facing feature set, since a supplier isn't a
// buyer.
const FEATURES = [
  {
    href: "/en/suppliers",
    icon: Users,
    title: "Verified Suppliers Directory",
    desc: "See how approved suppliers appear to buyers on our public directory.",
  },
  {
    href: "/en/sourcing",
    icon: LayoutGrid,
    title: "Product Categories We Source",
    desc: "The categories our buyers are actively sourcing across.",
  },
  {
    href: "/en/security",
    icon: ShieldCheck,
    title: "Trust & Security",
    desc: "How we vet suppliers and protect every transaction we broker.",
  },
  {
    href: "/en/about",
    icon: Info,
    title: "About The Unique Choice",
    desc: "Who we are and how we work with factories across China & Hong Kong.",
  },
];

export default async function SupplierPortalPage() {
  const email = await requireSupplierEmail();
  const supplier = await getSupplierBySelf(email);

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center sm:px-6">
        <div>
          <p className="text-sm text-muted">
            We couldn&apos;t find a supplier account for {email}. It may have been removed.
          </p>
          <form action={logout} className="mt-4">
            <button type="submit" className="btn-secondary">
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  const status = STATUS_CONTENT[supplier.status];
  const StatusIcon = status.icon;

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-8">
          <div>
            <p className="eyebrow eyebrow-ruled accent-text text-sm">Supplier Account</p>
            <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">{supplier.company_name}</h1>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted">
              <span>{supplier.email}</span>
              <span className="inline-flex items-center gap-1.5 border-l border-border pl-3">
                <Building2 size={13} />
                {supplier.contact_name}
              </span>
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

        <div className="glass-strong card mt-8 flex flex-wrap items-start gap-4">
          <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${status.classes}`}>
            <StatusIcon size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-semibold">{status.label}</p>
            <p className="mt-1 text-sm text-muted">{status.desc}</p>
          </div>
        </div>

        <section className="mt-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg font-semibold">Your Profile</h2>
            <Link
              href="/supplier-portal/profile"
              className="flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
            >
              <Pencil size={14} />
              Edit my profile
            </Link>
          </div>
          <div className="glass-strong card mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Tags size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Product categories</p>
                <p className="mt-1 text-sm">{supplier.product_categories || "Not provided yet"}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Location</p>
                <p className="mt-1 text-sm">
                  {[supplier.business_address, supplier.country].filter(Boolean).join(", ") || "Not provided yet"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Star size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Rating</p>
                <p className="mt-1 text-sm">
                  {supplier.rating ? `${supplier.rating} / 5 — set by our team after working together` : "Not yet rated"}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Building2 size={16} className="mt-0.5 shrink-0 text-muted" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Phone</p>
                <p className="mt-1 text-sm">{supplier.phone || "Not provided yet"}</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14">
          <p className="eyebrow eyebrow-ruled accent-text text-sm">More From The Unique Choice</p>
          <h2 className="font-display mt-2 text-xl font-semibold">Explore what else we can do for you</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
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
          <p className="text-sm text-muted">Questions about your application or listing?</p>
          <a
            href={whatsappLink("Hi! I'm signed in to my supplier account and have a question.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            <MessageCircle size={16} />
            Message Us on WhatsApp
          </a>
        </div>
      </div>
    </main>
  );
}
