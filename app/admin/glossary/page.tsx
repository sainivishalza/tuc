import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllGlossaryTerms, deleteGlossaryTerm } from "@/lib/actions/glossaryTerms";
import type { GlossaryTerm } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<GlossaryTerm["status"], BadgeTone> = {
  draft: "neutral",
  published: "success",
};

export default async function GlossaryAdminPage() {
  await requireAdminPage();
  const terms = await getAllGlossaryTerms();

  return (
    <AdminShell current="/admin/glossary">
      <PageHeader
        title="Glossary Terms"
        subtitle={`${terms.length} term${terms.length === 1 ? "" : "s"} across all locales.`}
        action={
          <LinkButton href="/admin/glossary/new">
            <Plus size={15} />
            New term
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {terms.length === 0 && <EmptyState>No glossary terms yet.</EmptyState>}

        {terms.map((t) => (
          <Card key={t.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[t.status]}>{t.status}</Badge>
                <Badge>{t.locale}</Badge>
              </div>
              <p className="mt-1.5 truncate font-display text-sm font-semibold text-gray-900">{t.term}</p>
              <p className="truncate text-xs text-gray-400">#{t.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/glossary/${t.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteGlossaryTerm(t.id, t.locale);
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
