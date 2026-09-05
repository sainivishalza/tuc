import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getQuoteRequests, updateQuoteRequestStatus } from "@/lib/actions/quoteRequests";
import type { QuoteRequest } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusStyles: Record<QuoteRequest["status"], string> = {
  new: "bg-blue-100 text-blue-700",
  contacted: "bg-amber-100 text-amber-700",
  closed: "bg-gray-100 text-gray-500",
};

export default async function QuoteRequestsPage() {
  await requireAdminPage();
  const requests = await getQuoteRequests();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">
          Quote Requests
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {requests.length} submission{requests.length === 1 ? "" : "s"} from the Quote Wizard.
        </p>

        <div className="mt-8 flex flex-col gap-4">
          {requests.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No quote requests yet.
            </div>
          )}

          {requests.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-500">
                    {r.email}
                    {r.whatsapp ? ` · ${r.whatsapp}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[r.status]}`}
                  >
                    {r.status}
                  </span>
                  <span className="text-xs text-gray-400">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-gray-600 sm:grid-cols-3">
                <p><span className="font-semibold text-gray-800">Product:</span> {r.product || "—"}</p>
                <p><span className="font-semibold text-gray-800">Quantity:</span> {r.quantity || "—"}</p>
                <p><span className="font-semibold text-gray-800">Timeline:</span> {r.timeline || "—"}</p>
              </div>

              {r.message && (
                <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{r.message}</p>
              )}

              <form
                action={async (formData: FormData) => {
                  "use server";
                  const status = formData.get("status") as QuoteRequest["status"];
                  await updateQuoteRequestStatus(r.id, status);
                }}
                className="mt-4 flex items-center gap-2"
              >
                <select
                  name="status"
                  defaultValue={r.status}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700"
                >
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="closed">Closed</option>
                </select>
                <button
                  type="submit"
                  className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                >
                  Update
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
