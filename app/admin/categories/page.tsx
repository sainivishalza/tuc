import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCategoryPages, deleteCategoryPage } from "@/lib/actions/categoryPages";
import type { CategoryPage } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<CategoryPage["status"], BadgeTone> = {
  draft: "neutral",
  published: "success",
};

export default async function CategoryPagesAdminPage() {
  await requireAdminPage();
  const categories = await getAllCategoryPages();

  return (
    <AdminShell current="/admin/categories">
      <PageHeader
        title="Category Pages"
        subtitle={`${categories.length} page${categories.length === 1 ? "" : "s"} across all locales.`}
        action={
          <LinkButton href="/admin/categories/new">
            <Plus size={15} />
            New category page
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {categories.length === 0 && <EmptyState>No category pages yet.</EmptyState>}

        {categories.map((cat) => (
          <Card key={cat.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[cat.status]}>{cat.status}</Badge>
                <Badge>{cat.locale}</Badge>
              </div>
              <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">{cat.name}</p>
              <p className="truncate text-xs text-gray-400">/sourcing/{cat.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/categories/${cat.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteCategoryPage(cat.id, cat.locale, cat.slug);
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
