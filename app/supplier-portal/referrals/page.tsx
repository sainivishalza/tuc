import Link from "next/link";
import { ArrowLeft, Gift, Clock, CheckCircle2, XCircle } from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierBySelf, getMyReferrals } from "@/lib/actions/supplierPortal";
import ReferralLinkBox from "@/components/supplierPortal/ReferralLinkBox";
import type { Supplier } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const STATUS_BADGE: Record<Supplier["status"], { icon: typeof Clock; label: string; classes: string }> = {
  pending: { icon: Clock, label: "Under review", classes: "bg-amber-100 text-amber-700" },
  approved: { icon: CheckCircle2, label: "Approved", classes: "bg-emerald-100 text-emerald-700" },
  rejected: { icon: XCircle, label: "Not approved", classes: "bg-red-100 text-red-700" },
};

export default async function SupplierReferralsPage() {
  const email = await requireSupplierEmail();
  const supplier = await getSupplierBySelf(email);

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted">We couldn&apos;t find a supplier account for {email}.</p>
      </main>
    );
  }

  const referrals = await getMyReferrals();
  const referralLink = `https://theuniquechoice.com/en/suppliers/register?ref=${supplier.id}`;

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/supplier-portal" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft size={14} />
          Back to your account
        </Link>

        <p className="eyebrow eyebrow-ruled accent-text text-sm">Supplier Account</p>
        <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">Refer another supplier</h1>
        <p className="mt-2 text-sm text-muted">
          Know another factory or trading company that should be listed with us? Share your link below — once they
          register and our team approves them, we&apos;ll reach out to you about your referral reward.
        </p>

        <div className="mt-6">
          <ReferralLinkBox link={referralLink} />
        </div>

        <div className="glass-strong card mt-8">
          <h2 className="font-display flex items-center gap-2 text-base font-semibold">
            <Gift size={16} />
            Your Referrals ({referrals.length})
          </h2>
          {referrals.length === 0 ? (
            <p className="mt-3 text-sm text-muted">No one has registered with your link yet.</p>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {referrals.map((r) => {
                const badge = STATUS_BADGE[r.status];
                const BadgeIcon = badge.icon;
                return (
                  <div key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{r.company_name}</p>
                      <p className="text-xs text-muted">{new Date(r.created_at).toLocaleDateString()}</p>
                    </div>
                    <span className={`flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge.classes}`}>
                      <BadgeIcon size={12} />
                      {badge.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
