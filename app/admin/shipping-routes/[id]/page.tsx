import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminAuth";
import { getShippingRouteById } from "@/lib/actions/shippingRoutes";
import ShippingRouteForm from "@/components/admin/ShippingRouteForm";
import AdminShell from "@/components/admin/AdminShell";
import { BackLink, PageHeader, Card } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function EditShippingRoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdminPage();
  const { id } = await params;
  const route = await getShippingRouteById(id);

  if (!route) notFound();

  return (
    <AdminShell current="/admin/shipping-routes">
      <BackLink href="/admin/shipping-routes">Shipping Routes</BackLink>
      <PageHeader title="Edit shipping route page" />

      <Card className="max-w-3xl">
        <ShippingRouteForm routeId={route.id} initial={route} />
      </Card>
    </AdminShell>
  );
}
