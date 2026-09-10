import { Plus, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import { getAllCaseStudies, deleteCaseStudy } from "@/lib/actions/caseStudies";
import type { CaseStudy } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, LinkButton, Button, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<CaseStudy["status"], BadgeTone> = {
  draft: "neutral",
  published: "success",
};

export default async function CaseStudiesAdminPage() {
  await requireAdminPage();
  const caseStudies = await getAllCaseStudies();

  return (
    <AdminShell current="/admin/case-studies">
      <PageHeader
        title="Case Studies"
        subtitle={`${caseStudies.length} case stud${caseStudies.length === 1 ? "y" : "ies"} across all locales.`}
        action={
          <LinkButton href="/admin/case-studies/new">
            <Plus size={15} />
            New case study
          </LinkButton>
        }
      />

      <div className="flex flex-col gap-3">
        {caseStudies.length === 0 && <EmptyState>No case studies yet.</EmptyState>}

        {caseStudies.map((cs) => (
          <Card key={cs.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Badge tone={statusTones[cs.status]}>{cs.status}</Badge>
                <Badge>{cs.locale}</Badge>
              </div>
              <p className="mt-1.5 truncate font-admin-display text-sm font-semibold text-gray-900">{cs.title}</p>
              <p className="truncate text-xs text-gray-400">{cs.client_name} · /{cs.slug}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <LinkButton href={`/admin/case-studies/${cs.id}`} variant="secondary" size="sm">
                Edit
              </LinkButton>
              <form
                action={async () => {
                  "use server";
                  await deleteCaseStudy(cs.id, cs.locale, cs.slug);
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
