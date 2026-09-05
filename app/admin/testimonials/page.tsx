import Link from "next/link";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireAdminPage } from "@/lib/adminAuth";
import {
  getAllTestimonials,
  createTestimonial,
  updateTestimonialStatus,
  deleteTestimonial,
} from "@/lib/actions/testimonials";
import { locales } from "@/lib/i18n";
import type { Testimonial } from "@/lib/supabase/types";

export const metadata = {
  robots: { index: false, follow: false },
};

const statusStyles: Record<Testimonial["status"], string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-gray-100 text-gray-500",
};

export default async function TestimonialsAdminPage() {
  await requireAdminPage();
  const testimonials = await getAllTestimonials();

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

        <h1 className="mt-4 font-display text-2xl font-bold text-gray-900">Testimonials</h1>
        <p className="mt-1 text-sm text-gray-500">
          Only approved testimonials appear on the public site. Add real client reviews here as orders complete.
        </p>

        {/* Add new testimonial */}
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
          className="mt-8 rounded-2xl border border-gray-200 bg-white p-5"
        >
          <h2 className="font-display text-sm font-semibold text-gray-900">Add a testimonial</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <input
              name="name"
              placeholder="Client name *"
              required
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <input
              name="company"
              placeholder="Company"
              className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <textarea
              name="quote"
              placeholder="Quote *"
              required
              rows={3}
              className="sm:col-span-2 resize-none rounded-lg border border-gray-200 px-3 py-2 text-sm"
            />
            <select name="rating" defaultValue="5" className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {[5, 4, 3, 2, 1].map((r) => (
                <option key={r} value={r}>{r} star{r === 1 ? "" : "s"}</option>
              ))}
            </select>
            <select name="locale" defaultValue="en" className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              {locales.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
            <select name="status" defaultValue="approved" className="rounded-lg border border-gray-200 px-3 py-2 text-sm sm:col-span-2">
              <option value="approved">Approved — show on site now</option>
              <option value="pending">Pending review</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            Add testimonial
          </button>
        </form>

        {/* List */}
        <div className="mt-8 flex flex-col gap-4">
          {testimonials.length === 0 && (
            <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
              No testimonials yet.
            </div>
          )}

          {testimonials.map((t) => (
            <div key={t.id} className="rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-display text-sm font-semibold text-gray-900">
                    {t.name} {t.company ? `— ${t.company}` : ""}
                  </p>
                  <p className="text-xs text-gray-500">
                    {"★".repeat(t.rating)}{"☆".repeat(5 - t.rating)} · {t.locale}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${statusStyles[t.status]}`}>
                  {t.status}
                </span>
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
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs text-gray-700"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  <button
                    type="submit"
                    className="rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-gray-700"
                  >
                    Update
                  </button>
                </form>

                <form
                  action={async () => {
                    "use server";
                    await deleteTestimonial(t.id);
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
