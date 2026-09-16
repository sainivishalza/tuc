import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getSupplierBySelf } from "@/lib/actions/supplierPortal";
import SupplierProfileForm from "@/components/supplierPortal/SupplierProfileForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SupplierProfilePage() {
  const email = await requireSupplierEmail();
  const supplier = await getSupplierBySelf(email);

  if (!supplier) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-16 text-center sm:px-6">
        <p className="text-sm text-muted">We couldn&apos;t find a supplier account for {email}.</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/supplier-portal"
          className="flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-foreground"
        >
          <ArrowLeft size={15} />
          Back to your account
        </Link>
        <p className="eyebrow eyebrow-ruled accent-text mt-6 text-sm">Supplier Account</p>
        <h1 className="font-display mt-2 text-2xl font-semibold sm:text-3xl">Edit your profile</h1>
        <p className="mt-1.5 text-sm text-muted">
          Keep your company details current — buyers see this information once your listing is approved.
        </p>

        <div className="mt-8">
          <SupplierProfileForm supplier={supplier} />
        </div>
      </div>
    </main>
  );
}
