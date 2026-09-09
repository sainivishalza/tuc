import { Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
} from "@/lib/actions/testimonials";
import { locales } from "@/lib/i18n";
import type { Testimonial } from "@/lib/supabase/types";
import AdminShell from "@/components/admin/AdminShell";
import { PageHeader, Card, EmptyState, Badge, Button, inputClass, type BadgeTone } from "@/components/admin/ui";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusTones: Record<Testimonial["status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "neutral",
};

export default async function TestimonialsAdminPage() {
  await requireAdminPage();
  const testimonials = await getAllTestimonials();

  return (
    <AdminShell current="/admin/testimonials">
      <PageHeader
        title="Testimonials"
        subtitle="Only approved testimonials appear on the public site. Add real client reviews here as orders complete."
      />

      <form
        action={async (formData: FormData) => {
          "use server";
          await createTestimonial({
            name: String(formData.get("name") ?? ""),
            company: String(formData.get("company") ?? ""),
            quote: String(formData.get("quote") ?? ""),
            rating: Number(formData.get("rating") ?? 5),
            locale: String(formData.get("locale") ?? "en"),
            status: (formData.get("status") as Testimonial["status"]) ?? "approved",
          });
        }}
      >
        <Card>
          <h2 className="font-admin-display text-sm font-semibold text-gray-900">Add a testimonial</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input name="name" placeholder="Client name *" required className={inputClass} />
            <input name="company" placeholder="Company" className={inputClass} />
            <textarea
              name="quote"
              placeholder="Quote *"
              required
              rows={3}
              className={`sm:col-span-2 resize-none ${inputClass}`}
            />
            <select name="rating" defaultValue="5" className={inputClass}>
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} star{r === 1 ? "" : "s"}</option>
              ))}
            </select>
            <select name="locale" defaultValue="en" className={inputClass}>
              {locales.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select name="status" defaultValue="approved" className={`sm:col-span-2 ${inputClass}`}>
              <option value="approved">Approved — show on site now</option>
              <option value="pending">Pending review</option>
            </select>
          </div>
          <Button type="submit" className="mt-4">
            Add testimonial
          </Button>
        </Card>
      </form>

      <div className="flex flex-col gap-4">
        {testimonials.length === 0 && <EmptyState>No testimonials yet.</EmptyState>}

        {testimonials.map((t) => (
          <Card key={t.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-admin-display text-sm font-semibold text-gray-900">
                  {t.name} {t.company ? `— ${t.company}` : ""}
                </p>
                <p className="text-xs text-gray-500">
                  {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)} · {t.locale}
                </p>
              </div>
              <Badge tone={statusTones[t.status]}>{t.status}</Badge>
            </div>

            <p className="mt-3 rounded-lg bg-gray-50 p-3 text-xs text-gray-600">{t.quote}</p>

            <div className="mt-4 flex items-center gap-2">
              <form
                action={async (formData: FormData) => {
                  "use server";
                  const status = formData.get("status") as Testimonial["status"];
                  await updateTestimonialStatus(t.id, status);
                }}
                className="flex items-center gap-2"
              >
                <select
                  name="status"
                  defaultValue={t.status}
                  className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                >
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
                <Button type="submit" size="sm">
                  Update
                </Button>
              </form>

              <form
                action={async () => {
                  "use server";
                  await deleteTestimonial(t.id);
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
