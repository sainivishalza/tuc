"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Building2, Mail, UserPlus } from "lucide-react";
import { createEmailCampaign, getAudienceCount } from "@/lib/actions/emailCampaigns";
import type { EmailTemplate, EmailCampaignSegments } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

/** A datetime-local input needs "YYYY-MM-DDTHH:mm" in the *local*
 * timezone with no offset suffix — toISOString() gives UTC, so this
 * builds the local equivalent by hand. Used only as the default value a
 * minute from now, so the picker doesn't open already in the past. */
function localDateTimeInputDefault(minutesFromNow: number): string {
  const d = new Date(Date.now() + minutesFromNow * 60 * 1000);
  d.setSeconds(0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function NewCampaignForm({ templates }: { templates: EmailTemplate[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const [segments, setSegments] = useState<EmailCampaignSegments>({ clients: true, suppliers: false, newsletter: true, prospects: false });
  const [count, setCount] = useState<number | null>(null);
  const [countLoading, setCountLoading] = useState(false);
  const [sendMode, setSendMode] = useState<"now" | "later">("now");
  const [scheduledAt, setScheduledAt] = useState(() => localDateTimeInputDefault(60));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Kicking off a fetch in response to a prop/state change (segments)
    // and showing a spinner while it's in flight — the standard shape
    // this lint rule can't distinguish from a derivable value, same
    // justification as Sidebar.tsx's collapsed-state read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCountLoading(true);
    getAudienceCount(segments)
      .then((n) => {
        if (!cancelled) setCount(n);
      })
      .finally(() => {
        if (!cancelled) setCountLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [segments]);

  function toggle(key: keyof EmailCampaignSegments) {
    setSegments((s) => ({ ...s, [key]: !s[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!templateId) {
      setError("Create a template first.");
      return;
    }
    let scheduledAtIso: string | null = null;
    if (sendMode === "later") {
      const parsed = new Date(scheduledAt);
      if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) {
        setError("Pick a time in the future to schedule this for.");
        return;
      }
      scheduledAtIso = parsed.toISOString();
    }
    setSubmitting(true);
    try {
      const id = await createEmailCampaign(templateId, name, segments, scheduledAtIso);
      router.push(`/admin/email/campaigns/${id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className={labelClass}>Campaign Name *</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="September newsletter" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Template *</label>
        <select value={templateId} onChange={(e) => setTemplateId(e.target.value)} className={inputClass}>
          {templates.length === 0 && <option value="">No templates yet</option>}
          {templates.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name} ({t.status})
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className={labelClass}>Audience</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={!!segments.clients} onChange={() => toggle("clients")} />
            <Users size={14} className="text-gray-400" />
            Registered clients (client portal accounts)
          </label>
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={!!segments.suppliers} onChange={() => toggle("suppliers")} />
            <Building2 size={14} className="text-gray-400" />
            Suppliers (all applications, any status)
          </label>
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={!!segments.newsletter} onChange={() => toggle("newsletter")} />
            <Mail size={14} className="text-gray-400" />
            Newsletter & guide-download subscribers
          </label>
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="checkbox" checked={!!segments.prospects} onChange={() => toggle("prospects")} />
            <UserPlus size={14} className="text-gray-400" />
            Prospects (outreach list — not yet a client or supplier)
          </label>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          {countLoading ? "Counting..." : count === null ? "" : `${count} unique recipient${count === 1 ? "" : "s"} — unsubscribed emails already excluded.`}
        </p>
      </div>

      <div>
        <label className={labelClass}>When to send</label>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="radio" name="sendMode" checked={sendMode === "now"} onChange={() => setSendMode("now")} />
            Save as a draft — I&apos;ll send the first batch myself
          </label>
          <label className="flex items-center gap-2.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-700">
            <input type="radio" name="sendMode" checked={sendMode === "later"} onChange={() => setSendMode("later")} />
            Schedule it — send automatically, no clicking required
          </label>
          {sendMode === "later" && (
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              min={localDateTimeInputDefault(1)}
              className={inputClass}
            />
          )}
        </div>
        {sendMode === "later" && (
          <p className="mt-2 text-xs text-gray-500">
            Once this time passes, the campaign sends itself in batches — respecting the same hourly caps and circuit breaker as a
            manual send — until every recipient has been processed. You can cancel the schedule any time before it starts.
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting || templates.length === 0} className="mt-2 w-fit">
        {submitting ? "Creating..." : sendMode === "later" ? "Schedule campaign" : "Create campaign"}
      </Button>
    </form>
  );
}
