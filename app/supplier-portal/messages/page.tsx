import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierBySelf } from "@/lib/actions/supplierPortal";
import { getMyMessages } from "@/lib/actions/supplierMessages";
import SupplierMessageThread from "@/components/supplierPortal/SupplierMessageThread";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SupplierMessagesPage() {
  const email = await requireSupplierEmail();
  const supplier = await getSupplierBySelf(email);

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted">We couldn&apos;t find a supplier account for {email}.</p>
      </main>
    );
  }

  const messages = await getMyMessages();

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-2xl">
        <Link href="/supplier-portal" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft size={14} />
          Back to your account
        </Link>

        <p className="eyebrow eyebrow-ruled accent-text text-sm">Supplier Account</p>
        <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">Messages</h1>
        <p className="mt-2 text-sm text-muted">Talk to our team directly — no need to leave the portal for email or WhatsApp.</p>

        <div className="mt-8">
          <SupplierMessageThread messages={messages} />
        </div>
      </div>
    </main>
  );
}
