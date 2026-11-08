"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star, Check, X, Trash2 } from "lucide-react";
import { updateReviewStatus, deleteReview, type AdminSupplierReview } from "@/lib/actions/supplierReviews";
import { Card, Button, Badge, EmptyState, type BadgeTone } from "@/components/admin/ui";

const STATUS_TONE: Record<AdminSupplierReview["status"], BadgeTone> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
};

export default function ReviewsTable({ reviews }: { reviews: AdminSupplierReview[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  function setStatus(id: string, status: AdminSupplierReview["status"]) {
    setBusyId(id);
    startTransition(async () => {
      await updateReviewStatus(id, status);
      setBusyId(null);
      router.refresh();
    });
  }

  function remove(id: string) {
    if (!confirm("Delete this review? This can't be undone.")) return;
    setBusyId(id);
    startTransition(async () => {
      await deleteReview(id);
      setBusyId(null);
      router.refresh();
    });
  }

  if (reviews.length === 0) {
    return <EmptyState icon={Star}>No reviews yet.</EmptyState>;
  }

  return (
    <div className="flex flex-col gap-3">
      {reviews.map((r) => (
        <Card key={r.id} className="flex flex-col gap-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-admin-display text-sm font-semibold text-gray-900">{r.reviewer_name}</p>
                <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
              </div>
              <p className="mt-0.5 text-xs text-gray-400">
                {r.supplier_company_name} · {r.reviewer_email} · {new Date(r.created_at).toLocaleDateString()}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <Star key={n} size={13} className={n <= r.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} />
              ))}
            </span>
          </div>
          {r.comment && <p className="text-sm text-gray-700">{r.comment}</p>}
          <div className="flex items-center gap-2">
            {r.status !== "approved" && (
              <Button size="sm" variant="secondary" disabled={isPending && busyId === r.id} onClick={() => setStatus(r.id, "approved")}>
                <Check size={13} />
                Approve
              </Button>
            )}
            {r.status !== "rejected" && (
              <Button size="sm" variant="secondary" disabled={isPending && busyId === r.id} onClick={() => setStatus(r.id, "rejected")}>
                <X size={13} />
                Reject
              </Button>
            )}
            <Button size="sm" variant="danger" disabled={isPending && busyId === r.id} onClick={() => remove(r.id)}>
              <Trash2 size={13} />
              Delete
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
