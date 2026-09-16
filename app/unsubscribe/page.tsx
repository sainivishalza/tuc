import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { unsubscribeByToken } from "@/lib/actions/emailCampaigns";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await unsubscribeByToken(token) : { ok: false };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-16 sm:px-6">
      <div className="w-full max-w-sm text-center">
        <Link href="/" className="mb-6 flex items-center justify-center gap-2.5">
          <span className="brand-gradient flex h-9 w-9 items-center justify-center rounded-lg font-display text-base font-semibold text-white">
            U
          </span>
          <span className="font-display text-base font-semibold tracking-tight">
            <span className="text-accent">The Unique</span> Choice
          </span>
        </Link>

        <div className="glass-strong rounded-2xl p-8">
          {result.ok ? (
            <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <CheckCircle2 size={20} />
              </div>
              <h1 className="font-display mt-4 text-xl font-semibold">You&apos;re unsubscribed</h1>
              <p className="mt-2 text-sm text-muted">
                {result.email} won&apos;t receive any more emails from our email campaigns. Transactional messages, like shipment
                updates for an active order, are unaffected.
              </p>
            </>
          ) : (
            <>
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
                <XCircle size={20} />
              </div>
              <h1 className="font-display mt-4 text-xl font-semibold">Link not valid</h1>
              <p className="mt-2 text-sm text-muted">
                This unsubscribe link is invalid or expired. Message us on WhatsApp and we&apos;ll remove you manually.
              </p>
            </>
          )}
        </div>
      </div>
    </main>
  );
}
