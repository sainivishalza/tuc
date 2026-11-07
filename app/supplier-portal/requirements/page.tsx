import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierVisibleSourcingRequests, getAllCategories } from "@/lib/actions/sourcingRequests";
import SupplierRequirementsBoard from "@/components/supplierPortal/SupplierRequirementsBoard";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SupplierRequirementsPage() {
  await requireSupplierEmail();
  const [requests, categories] = await Promise.all([getSupplierVisibleSourcingRequests(), getAllCategories()]);

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <Link href="/supplier-portal" className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground">
          <ArrowLeft size={14} />
          Back to my account
        </Link>

        <p className="eyebrow eyebrow-ruled accent-text text-sm">Open Requirements</p>
        <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">Buyers looking for suppliers like you</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted">
          Click &quot;I&apos;m interested&quot; on any requirement to instantly see the buyer&apos;s contact details — they&apos;ll be notified that you&apos;re interested.
        </p>

        <div className="mt-8">
          <SupplierRequirementsBoard requests={requests} categories={categories} />
        </div>
      </div>
    </main>
  );
}
