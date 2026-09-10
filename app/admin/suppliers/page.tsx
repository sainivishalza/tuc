import { FileCheck2, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllSuppliers, updateSupplierStatus, deleteSupplier } from "@/lib/actions/suppliers";
import type { Supplier } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<Supplier["status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "neutral",
};

export default async function SuppliersAdminPage() {
  await requireAdminPage();
  const suppliers = await getAllSuppliers();

  return (
    <AdminShell current="/admin/suppliers">
      <PageHeader
        title="Suppliers"
        subtitle={`${suppliers.length} registration${suppliers.length === 1 ? "" : "s"}. Only approved suppliers show on the public Verified Suppliers page.`}
      />

      <div className="flex flex-col gap-4">
        {suppliers.length === 0 && <EmptyState>No supplier registrations yet.</EmptyState>}

        {suppliers.map((s) => (
          <Card key={s.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-admin-display text-sm font-semibold text-gray-900">{s.company_name}</p>
                <p className="text-xs text-gray-500">
                  {s.contact_name} · {s.email}
                  {s.phone ? ` · ${s.phone}` : ""}
                </p>
                {s.product_categories && (
                  <p className="mt-1 text-xs text-gray-400">{s.product_categories}</p>
                )}
              </div>
              <Badge tone={statusTones[s.status]}>{s.status}</Badge>
            </div>

            <div className="mt-3 flex flex-wrap gap-3 text-xs">
              {s.business_license_url && (
                <a href={s.business_license_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline underline-offset-2">
                  <FileCheck2 size={12} /> Business license
                </a>
              )}
              {s.visiting_card_url && (
                <a href={s.visiting_card_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline underline-offset-2">
                  <FileCheck2 size={12} /> Visiting card
                </a>
              )}
              {s.company_photo_url && (
                <a href={s.company_photo_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent underline underline-offset-2">
                  <FileCheck2 size={12} /> Company photo
                </a>
              )}
              {!s.business_license_url && !s.visiting_card_url && !s.company_photo_url && (
                <span className="text-gray-400">No documents uploaded</span>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const status = formData.get("status") as Supplier["status"];
                  await updateSupplierStatus(s.id, status);
                }}
                className="flex items-center gap-2"
              >
                <select
                  name="status"
                  defaultValue={s.status}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button type="submit" size="sm">
                  Update
                </Button>
              </form>

              <LinkButton href={`/admin/suppliers/${s.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>

              <form
                action={async () => {
                  "use server";
                  await deleteSupplier(s.id);
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
