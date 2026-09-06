import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCarriers } from "@/lib/actions/carriers";
import ShipmentForm from "@/components/admin/ShipmentForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewShipmentPage() {
  await requireAdminPage();
  const carriers = await getAllCarriers();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin/shipments"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Shipment Tracking
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">New shipment</h1>

        <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-6">
          <ShipmentForm carriers={carriers} />
        </div>
      </div>
    </main>
  );
}
