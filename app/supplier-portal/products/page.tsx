import { requireSupplierEmail } from "@/lib/supplierAuth";
import { getMyProducts } from "@/lib/actions/supplierProducts";
import { getAllCategories } from "@/lib/actions/sourcingRequests";
import SupplierProductsManager from "@/components/supplierPortal/SupplierProductsManager";
import BulkProductImportForm from "@/components/supplierPortal/BulkProductImportForm";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function SupplierProductsPage() {
  await requireSupplierEmail();
  const [products, categories] = await Promise.all([getMyProducts(), getAllCategories()]);

  return (
    <main className="min-h-screen px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-5xl">
        <p className="eyebrow eyebrow-ruled accent-text text-sm">Your Catalog</p>
        <h1 className="font-display mt-3 text-2xl font-semibold sm:text-3xl">Products</h1>
        <p className="mt-1.5 text-sm text-muted">
          List what you sell — buyers browse the public catalog and find you by product, not just by company name.
        </p>

        <div className="mt-6">
          <BulkProductImportForm />
        </div>

        <div className="mt-8">
          <SupplierProductsManager products={products} categories={categories} />
        </div>
      </div>
    </main>
  );
}
