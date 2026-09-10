import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllShippingRoutes, deleteShippingRoute } from "@/lib/actions/shippingRoutes";
import type { ShippingRoute } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<ShippingRoute["status"], BadgeTone> = {
  draft: "neutral",
  published: "success",
};

export default async function ShippingRoutesAdminPage() {
  await requireAdminPage();
  const routes = await getAllShippingRoutes();

  return (
    <AdminShell current="/admin/shipping-routes">
      <PageHeader
        title="Shipping Routes"
        subtitle={`${routes.length} route page${routes.length === 1 ? "" : "s"} across all locales.`}
        action={
          <LinkButton href="/admin/shipping-routes/new">
            <Plus size={15} />
            New route page
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {routes.length === 0 && <EmptyState>No shipping route pages yet.</EmptyState>}

        {routes.map((r) => (
          <Card key={r.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[r.status]}>{r.status}</Badge>
                <Badge>{r.locale}</Badge>
              </div>
              <p className="mt-1.5 truncate font-admin-display text-sm font-semibold text-gray-900">{r.destination_name}</p>
              <p className="truncate text-xs text-gray-400">/shipping/{r.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/shipping-routes/${r.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteShippingRoute(r.id, r.locale, r.slug);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 size={12} />
                  Delete
                </Button>
              </form>
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
