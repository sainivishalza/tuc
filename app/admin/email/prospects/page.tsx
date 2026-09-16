import { Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getEmailProspects, deleteEmailProspect } from "@/lib/actions/emailCampaigns";
import { AddProspectForm, BulkImportProspectsForm } from "@/components/admin/ProspectImportForms";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card, EmptyState, Button } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EmailProspectsPage() {
  await requireAdminPage();
  const prospects = await getEmailProspects();

  return (
    <AdminShell current="/admin/email">
      <BackLink href="/admin/email">Email</BackLink>
      <PageHeader
        title="Prospects"
        subtitle="People who aren't a client or supplier yet — a list you build for outreach, inviting them to become one or the other."
      />

      <Card>
        <p className="mb-3 font-admin-display text-sm font-semibold text-gray-900">Add one</p>
        <AddProspectForm />
      </Card>

      <Card>
        <p className="mb-3 font-admin-display text-sm font-semibold text-gray-900">Bulk import</p>
        <BulkImportProspectsForm />
      </Card>

      <div>
        <p className="mb-3 font-admin-display text-sm font-semibold text-gray-900">
          {prospects.length} prospect{prospects.length === 1 ? "" : "s"}
        </p>
        <div className="flex flex-col gap-2">
          {prospects.length === 0 && <EmptyState>No prospects yet — add one above or bulk import a list.</EmptyState>}
          {prospects.map((p) => (
            <Card key={p.id} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-gray-900">{p.email}</p>
                <p className="truncate text-xs text-gray-400">{[p.name, p.note].filter(Boolean).join(" — ") || "No details"}</p>
              </div>
              <form
                action={async () => {
                  "use server";
                  await deleteEmailProspect(p.id);
                }}
              >
                <Button type="submit" variant="danger" size="sm">
                  <Trash2 size={12} />
                  Remove
                </Button>
              </form>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
