import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCarriers, createCarrier, deleteCarrier } from "@/lib/actions/carriers";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function CarriersAdminPage() {
  await requireAdminPage();
  const carriers = await getAllCarriers();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Carriers</h1>
        <p className="mt-1 text-sm text-gray-500">
          Logistics companies you ship through (ddu56, DHL, or anyone else). Each shipment
          picks a carrier from this list — add a new one here whenever you start working with
          a different company.
        </p>

        <form
          action={async (formData: FormData) => {
            "use server";
            await createCarrier({
              name: String(formData.get("name") ?? ""),
              website_url: String(formData.get("website_url") ?? "") || null,
              notes: String(formData.get("notes") ?? "") || null,
            });
          }}
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5"
        >
          <h2 className="font-display text-sm font-semibold text-gray-900">Add a carrier</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Carrier name (e.g. DDU56)"
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <input
              name="website_url"
              placeholder="Their tracking site URL (optional)"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            />
            <textarea
              name="notes"
              placeholder="Notes for yourself (optional)"
              rows={2}
              className="resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Add carrier
          </button>
        </form>

        <div className="mt-8 flex flex-col gap-3">
          {carriers.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No carriers yet — add one above.
            </div>
          )}

          {carriers.map((carrier) => (
            <div
              key={carrier.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-sm font-semibold text-gray-900">
                  {carrier.name}
                </p>
                {carrier.website_url && (
                  <a
                    href={carrier.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-gray-400 hover:text-gray-600"
                  >
                    {carrier.website_url}
                  </a>
                )}
                {carrier.notes && (
                  <p className="mt-1 truncate text-xs text-gray-400">{carrier.notes}</p>
                )}
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteCarrier(carrier.id);
                }}
              >
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500"
                >
                  <Trash2 size={12} />
                  Delete
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
