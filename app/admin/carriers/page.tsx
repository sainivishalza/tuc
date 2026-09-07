import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCarriers, createCarrier, updateCarrier, deleteCarrier } from "@/lib/actions/carriers";

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
              api_provider: String(formData.get("api_provider") ?? "") || null,
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
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-gray-700">Tracking source</label>
              <select
                name="api_provider"
                defaultValue=""
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              >
                <option value="">Manual (you enter updates yourself)</option>
                <option value="dhl">DHL API (live tracking pulled automatically)</option>
              </select>
            </div>
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
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate font-display text-sm font-semibold text-gray-900">
                    {carrier.name}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                      carrier.api_provider === "dhl"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {carrier.api_provider === "dhl" ? "DHL API" : "Manual"}
                  </span>
                </div>
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
                action={async (formData: FormData) => {
                  "use server";
                  await updateCarrier(carrier.id, {
                    name: carrier.name,
                    website_url: carrier.website_url,
                    notes: carrier.notes,
                    api_provider: String(formData.get("api_provider") ?? "") || null,
                  });
                }}
                className="flex shrink-0 items-center gap-2"
              >
                <select
                  name="api_provider"
                  defaultValue={carrier.api_provider ?? ""}
                  className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs"
                >
                  <option value="">Manual</option>
                  <option value="dhl">DHL API</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-gray-400 hover:text-gray-900"
                >
                  Save
                </button>
              </form>
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
