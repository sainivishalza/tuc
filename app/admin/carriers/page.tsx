import { Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCarriers, createCarrier, updateCarrier, deleteCarrier } from "@/lib/actions/carriers";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, Button, inputClass, labelClass } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function CarriersAdminPage() {
  await requireAdminPage();
  const carriers = await getAllCarriers();

  return (
    <AdminShell current="/admin/carriers">
      <PageHeader
        title="Carriers"
        subtitle="Logistics companies you ship through (ddu56, DHL, or anyone else). Each shipment picks a carrier from this list — add a new one here whenever you start working with a different company."
      />

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
      >
        <Card>
          <h2 className="font-admin-display text-sm font-semibold text-gray-900">Add a carrier</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="name" placeholder="Carrier name (e.g. DDU56)" required className={`sm:col-span-2 ${inputClass}`} />
            <input name="website_url" placeholder="Their tracking site URL (optional)" className={`sm:col-span-2 ${inputClass}`} />
            <textarea
              name="notes"
              placeholder="Notes for yourself (optional)"
              rows={2}
              className={`sm:col-span-2 resize-none ${inputClass}`}
            />
            <div className="sm:col-span-2">
              <label className={labelClass}>Tracking source</label>
              <select name="api_provider" defaultValue="" className={inputClass}>
                <option value="">Manual (you enter updates yourself)</option>
                <option value="dhl">DHL API (live tracking pulled automatically)</option>
              </select>
            </div>
          </div>
          <Button type="submit" className="mt-4">
            Add carrier
          </Button>
        </Card>
      </form>

      <div className="flex flex-col gap-3">
        {carriers.length === 0 && <EmptyState>No carriers yet — add one above.</EmptyState>}

        {carriers.map((carrier) => (
          <Card key={carrier.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-admin-display text-sm font-semibold text-gray-900">
                  {carrier.name}
                </p>
                <Badge tone={carrier.api_provider === "dhl" ? "success" : "neutral"}>
                  {carrier.api_provider === "dhl" ? "DHL API" : "Manual"}
                </Badge>
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
                className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="">Manual</option>
                <option value="dhl">DHL API</option>
              </select>
              <Button type="submit" variant="secondary" size="sm">
                Save
              </Button>
            </form>
            <form
              action={async () => {
                "use server";
                await deleteCarrier(carrier.id);
              }}
            >
              <Button type="submit" variant="danger" size="sm">
                <Trash2 size={12} />
                Delete
              </Button>
            </form>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
