import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCategoryPages, deleteCategoryPage } from "@/lib/actions/categoryPages";
import type { CategoryPage } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusStyles: Record<CategoryPage["status"], string> = {
  draft: "bg-gray-100 text-gray-500",
  published: "bg-emerald-100 text-emerald-700",
};

export default async function CategoryPagesAdminPage() {
  await requireAdminPage();
  const categories = await getAllCategoryPages();

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900"
        >
          <ArrowLeft size={14} />
          Admin
        </Link>

        <div className="mt-4 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-gray-900">Category Pages</h1>
            <p className="mt-1 text-sm text-gray-500">
              {categories.length} page{categories.length === 1 ? "" : "s"} across all locales.
            </p>
          </div>
          <Link
            href="/admin/categories/new"
            className="flex items-center gap-1.5 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus size={15} />
            New category page
          </Link>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          {categories.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No category pages yet.
            </div>
          )}

          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${statusStyles[cat.status]}`}>
                    {cat.status}
                  </span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-500">
                    {cat.locale}
                  </span>
                </div>
                <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">{cat.name}</p>
                <p className="truncate text-xs text-gray-400">/sourcing/{cat.slug}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/admin/categories/${cat.id}`}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                >
                  Edit
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await deleteCategoryPage(cat.id, cat.locale, cat.slug);
                  }}
                >
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-red-300 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
