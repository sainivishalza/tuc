import { requireAdminPage } from "@/lib/adminAuth";
import { getQuoteRequests } from "@/lib/actions/quoteRequests";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import QuoteRequestsTable from "@/components/admin/QuoteRequestsTable";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function QuoteRequestsPage() {
  await requireAdminPage();
  const requests = await getQuoteRequests();

  return (
    <AdminShell current="/admin/quote-requests">
      <PageHeader
        title="Quote Management"
        subtitle={`${requests.length} submission${requests.length === 1 ? "" : "s"} from the Quote Wizard. Click a row to view details, update status, or set a value.`}
      />
      <QuoteRequestsTable requests={requests} />
    </AdminShell>
  );
}
