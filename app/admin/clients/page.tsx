import { requireAdminPage } from "@/lib/adminAuth";
import { getClients } from "@/lib/actions/quoteRequests";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import ClientsTable from "@/components/admin/ClientsTable";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ClientsPage() {
  await requireAdminPage();
  const clients = await getClients();

  return (
    <AdminShell current="/admin/clients">
      <PageHeader
        title="Client Management"
        subtitle={`${clients.length} client${clients.length === 1 ? "" : "s"}, grouped from quote history by email. Click a row for order history and notes.`}
      />
      <ClientsTable clients={clients} />
    </AdminShell>
  );
}
