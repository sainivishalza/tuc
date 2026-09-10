import { requireAdminPage } from "@/lib/adminAuth";
import { getQuoteRequests, updateQuoteRequestStatus } from "@/lib/actions/quoteRequests";
import type { QuoteRequest } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<QuoteRequest["status"], BadgeTone> = {
  new: "info",
  contacted: "warning",
  closed: "neutral",
};

export default async function QuoteRequestsPage() {
  await requireAdminPage();
  const requests = await getQuoteRequests();

  return (
    <AdminShell current="/admin/quote-requests">
      <PageHeader
        title="Quote Requests"
        subtitle={`${requests.length} submission${requests.length === 1 ? "" : "s"} from the Quote Wizard.`}
      />

      <div className="flex flex-col gap-4">
        {requests.length === 0 && <EmptyState>No quote requests yet.</EmptyState>}

        {requests.map((r) => (
          <Card key={r.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-admin-display text-sm font-semibold text-gray-900">{r.name}</p>
                <p className="text-xs text-gray-500">
                  {r.email}
                  {r.whatsapp ? ` · ${r.whatsapp}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[r.status]}>{r.status}</Badge>
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

            {r.items && r.items.length > 0 && (
              <div className="mt-3 overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-50 text-left text-gray-500">
                      <th className="px-3 py-2 font-semibold">Product</th>
                      <th className="px-3 py-2 font-semibold">Quantity</th>
                      <th className="px-3 py-2 font-semibold">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((item, i) => (
                      <tr key={i} className="border-t border-gray-100 text-gray-600">
                        <td className="px-3 py-2">{item.product}</td>
                        <td className="px-3 py-2">{item.quantity || "—"}</td>
                        <td className="px-3 py-2">{item.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

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
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
              <Button type="submit" size="sm">
                Update
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
