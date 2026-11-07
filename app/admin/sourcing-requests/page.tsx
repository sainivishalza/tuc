import { requireAdminPage } from "@/lib/adminAuth";
import { getAllSourcingRequests, getPlatformSettings } from "@/lib/actions/sourcingRequests";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import SourcingRequestsTable from "@/components/admin/SourcingRequestsTable";
import PlatformSettingsCard from "@/components/admin/PlatformSettingsCard";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SourcingRequestsAdminPage() {
  await requireAdminPage();
  const [requests, settings] = await Promise.all([getAllSourcingRequests(), getPlatformSettings()]);

  return (
    <AdminShell current="/admin/sourcing-requests">
      <PageHeader
        title="Sourcing Requests"
        subtitle={`${requests.length} requirement${requests.length === 1 ? "" : "s"} posted by customers. Approve a request to publish it on the public board and notify matching suppliers.`}
      />
      <PlatformSettingsCard settings={settings} />
      <SourcingRequestsTable requests={requests} />
    </AdminShell>
  );
}
