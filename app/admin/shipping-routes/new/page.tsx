import { requireAdminPage } from "@/lib/adminAuth";
import ShippingRouteForm from "@/components/admin/ShippingRouteForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function NewShippingRoutePage() {
  await requireAdminPage();

  return (
    <AdminShell current="/admin/shipping-routes">
      <BackLink href="/admin/shipping-routes">Shipping Routes</BackLink>
      <PageHeader title="New shipping route page" />

      <Card className="max-w-3xl">
        <ShippingRouteForm />
      </Card>
    </AdminShell>
  );
}
