"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { updateSourcingRequest, pushToSuppliers, updateInterestDealStatus, type InterestedSupplierRow } from "@/lib/actions/sourcingRequests";
import type { AdminSourcingRequest, SourcingCategory, SourcingRequestType, SourcingRequestStatus, Supplier, SourcingRequestInterest } from "@/lib/supabase/types";
import { Button, Badge, inputClass, labelClass, type BadgeTone } from "@/components/admin/ui";

const DEAL_TONE: Record<SourcingRequestInterest["deal_status"], BadgeTone> = {
  pending: "neutral",
  won: "success",
  lost: "danger",
};

export default function SourcingRequestEditForm({
  request,
  categories,
  interestedSuppliers,
  approvedSuppliers,
}: {
  request: AdminSourcingRequest;
  categories: SourcingCategory[];
  interestedSuppliers: InterestedSupplierRow[];
  approvedSuppliers: Pick<Supplier, "id" | "company_name" | "email" | "product_categories">[];
}) {
  const router = useRouter();
  const [dealPending, startDealTransition] = useTransition();
  const [title, setTitle] = useState(request.title);
  const [description, setDescription] = useState(request.description);
  const [type, setType] = useState<SourcingRequestType>(request.type);
  const [categoryId, setCategoryId] = useState(request.category_id ?? "");
  const [quantity, setQuantity] = useState(request.quantity ?? "");
  const [budgetRange, setBudgetRange] = useState(request.budget_range ?? "");
  const [timeline, setTimeline] = useState(request.timeline ?? "");
  const [destination, setDestination] = useState(request.destination_country ?? "");
  const [customerName, setCustomerName] = useState(request.customer_name);
  const [customerEmail, setCustomerEmail] = useState(request.customer_email);
  const [customerWhatsapp, setCustomerWhatsapp] = useState(request.customer_whatsapp ?? "");
  const [videoUrl, setVideoUrl] = useState(request.video_url ?? "");
  const [socialLink, setSocialLink] = useState(request.social_link ?? "");
  const [titleZh, setTitleZh] = useState(request.title_zh ?? "");
  const [descriptionZh, setDescriptionZh] = useState(request.description_zh ?? "");
  const [titleRu, setTitleRu] = useState(request.title_ru ?? "");
  const [descriptionRu, setDescriptionRu] = useState(request.description_ru ?? "");
  const [status, setStatus] = useState<SourcingRequestStatus>(request.status);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [selectedSupplierIds, setSelectedSupplierIds] = useState<Set<string>>(new Set());
  const [pushing, setPushing] = useState(false);
  const [pushed, setPushed] = useState(false);

  async function handleSave() {
    setError("");
    setSubmitting(true);
    try {
      await updateSourcingRequest(request.id, {
        title,
        description,
        type,
        category_id: categoryId,
        quantity,
        budget_range: budgetRange,
        timeline,
        destination_country: destination,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_whatsapp: customerWhatsapp,
        video_url: videoUrl,
        social_link: socialLink,
        title_zh: titleZh,
        description_zh: descriptionZh,
        title_ru: titleRu,
        description_ru: descriptionRu,
        status,
      });
      router.push("/admin/sourcing-requests");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  function toggleSupplier(id: string) {
    setSelectedSupplierIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handlePush() {
    setPushing(true);
    await pushToSuppliers(request.id, Array.from(selectedSupplierIds));
    setPushing(false);
    setPushed(true);
    setSelectedSupplierIds(new Set());
    setTimeout(() => setPushed(false), 2500);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputClass} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelClass}>Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className={`resize-none ${inputClass}`} />
          </div>
          <div>
            <label className={labelClass}>Type</label>
            <select value={type} onChange={(e) => setType(e.target.value as SourcingRequestType)} className={inputClass}>
              <option value="product">Product</option>
              <option value="service">Service</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Category</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Quantity</label>
            <input value={quantity} onChange={(e) => setQuantity(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Budget</label>
            <input value={budgetRange} onChange={(e) => setBudgetRange(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Timeline</label>
            <input value={timeline} onChange={(e) => setTimeline(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Destination country</label>
            <input value={destination} onChange={(e) => setDestination(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Customer name *</label>
            <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer email *</label>
            <input type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Customer WhatsApp</label>
            <input value={customerWhatsapp} onChange={(e) => setCustomerWhatsapp(e.target.value)} className={inputClass} />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Video link</label>
            <input value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>Social / website link</label>
            <input value={socialLink} onChange={(e) => setSocialLink(e.target.value)} className={inputClass} />
          </div>
        </div>

        {request.image_urls.length > 0 && (
          <div className="border-t border-gray-100 pt-4">
            <label className={labelClass}>Uploaded photos</label>
            <div className="flex gap-3">
              {request.image_urls.map((url) => (
                <div key={url} className="relative h-20 w-20 overflow-hidden rounded-lg border border-gray-200">
                  <Image src={url} alt="" fill sizes="80px" className="object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-gray-100 pt-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Translations {request.translation_status === "failed" && <span className="text-red-500">(auto-translation failed — edit manually)</span>}
            {request.translation_status === "skipped" && <span className="text-amber-500">(auto-translation not configured)</span>}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Title (Chinese)</label>
              <input value={titleZh} onChange={(e) => setTitleZh(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Title (Russian)</label>
              <input value={titleRu} onChange={(e) => setTitleRu(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Description (Chinese)</label>
              <textarea value={descriptionZh} onChange={(e) => setDescriptionZh(e.target.value)} rows={2} className={`resize-none ${inputClass}`} />
            </div>
            <div>
              <label className={labelClass}>Description (Russian)</label>
              <textarea value={descriptionRu} onChange={(e) => setDescriptionRu(e.target.value)} rows={2} className={`resize-none ${inputClass}`} />
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4">
          <label className={labelClass}>Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as SourcingRequestStatus)} className={inputClass}>
            <option value="pending">Pending review</option>
            <option value="approved">Approved — visible on public board</option>
            <option value="rejected">Rejected</option>
            <option value="closed">Closed</option>
          </select>
          <p className="mt-1.5 text-xs text-gray-400">
            Approving for the first time emails every approved supplier whose category matches this request.
          </p>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <Button onClick={handleSave} disabled={submitting} className="mt-1 w-fit">
          {submitting ? "Saving..." : "Save changes"}
        </Button>
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-admin-display text-sm font-semibold text-gray-900">Supplier Interest ({interestedSuppliers.length})</h3>
        <p className="mt-1 text-xs text-gray-500">
          Contact happens directly between the customer and supplier, off-platform — mark the outcome here once you know it,
          since there&apos;s no other way for a completed deal to get recorded.
        </p>
        {interestedSuppliers.length === 0 ? (
          <p className="mt-2 text-sm text-gray-400">No supplier has expressed interest yet.</p>
        ) : (
          <div className="mt-2 flex flex-col gap-2">
            {interestedSuppliers.map((s) => (
              <div key={s.interest_id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <div>
                  <span className="font-medium text-gray-800">{s.company_name}</span>{" "}
                  <span className="text-gray-500">{s.email}{s.phone ? ` — ${s.phone}` : ""}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={DEAL_TONE[s.deal_status]}>{s.deal_status}</Badge>
                  <select
                    value={s.deal_status}
                    onChange={(e) => {
                      const next = e.target.value as SourcingRequestInterest["deal_status"];
                      startDealTransition(async () => {
                        await updateInterestDealStatus(s.interest_id, next);
                        router.refresh();
                      });
                    }}
                    disabled={dealPending}
                    className={`${inputClass} w-auto py-1 text-xs`}
                  >
                    <option value="pending">Pending</option>
                    <option value="won">Won</option>
                    <option value="lost">Lost</option>
                  </select>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border-t border-gray-100 pt-5">
        <h3 className="font-admin-display text-sm font-semibold text-gray-900">Push to Specific Suppliers</h3>
        <p className="mt-1 text-xs text-gray-500">
          On top of the open board and the automatic category-match email, notify hand-picked suppliers directly.
        </p>
        <div className="mt-3 flex max-h-60 flex-col gap-1.5 overflow-y-auto rounded-lg border border-gray-100 p-2">
          {approvedSuppliers.map((s) => (
            <label key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selectedSupplierIds.has(s.id)}
                onChange={() => toggleSupplier(s.id)}
                className="h-4 w-4 rounded accent-accent"
              />
              <span className="font-medium text-gray-800">{s.company_name}</span>
              <span className="text-xs text-gray-400">{s.product_categories || "no category listed"}</span>
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-3">
          <Button size="sm" variant="secondary" onClick={handlePush} disabled={pushing || selectedSupplierIds.size === 0}>
            {pushing ? "Sending…" : `Notify ${selectedSupplierIds.size || ""} supplier${selectedSupplierIds.size === 1 ? "" : "s"}`}
          </Button>
          {pushed && <Badge tone="success">Sent</Badge>}
          {request.push_count > 0 && <span className="text-xs text-gray-400">{request.push_count} already pushed previously</span>}
        </div>
      </div>
    </div>
  );
}
