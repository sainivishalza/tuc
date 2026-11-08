import { requireAdminPage } from "@/lib/adminAuth";
import { getAllReviews } from "@/lib/actions/supplierReviews";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader } from "@/components/admin/ui";
import ReviewsTable from "@/components/admin/ReviewsTable";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function ReviewsAdminPage() {
  await requireAdminPage();
  const reviews = await getAllReviews();

  return (
    <AdminShell current="/admin/reviews">
      <PageHeader
        title="Supplier Reviews"
        subtitle={`${reviews.length} review${reviews.length === 1 ? "" : "s"} submitted by customers. Approve to show on the supplier's public profile.`}
      />
      <ReviewsTable reviews={reviews} />
    </AdminShell>
  );
}
