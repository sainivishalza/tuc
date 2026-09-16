"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Send, CheckCircle } from "lucide-react";
import { createEmailTemplate, updateEmailTemplate, sendTestEmail, type EmailTemplateInput } from "@/lib/actions/emailCampaigns";
import { findSpamTriggerWords } from "@/lib/emailTemplateRenderer";
import type { EmailTemplate } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

const CATEGORIES: EmailTemplate["category"][] = ["newsletter", "announcement", "promotional", "invite", "general"];

export default function EmailTemplateForm({ template }: { template?: EmailTemplate }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [name, setName] = useState(template?.name ?? "");
  const [category, setCategory] = useState<EmailTemplate["category"]>(template?.category ?? "general");
  const [subject, setSubject] = useState(template?.subject ?? "");
  const [preheader, setPreheader] = useState(template?.preheader ?? "");
  const [headline, setHeadline] = useState(template?.headline ?? "");
  const [bodyText, setBodyText] = useState(template?.body_text ?? "");
  const [ctaText, setCtaText] = useState(template?.cta_text ?? "");
  const [ctaUrl, setCtaUrl] = useState(template?.cta_url ?? "");
  const [status, setStatus] = useState<EmailTemplate["status"]>(template?.status ?? "draft");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [testEmail, setTestEmail] = useState("");
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const spamWarnings = Array.from(new Set([...findSpamTriggerWords(subject), ...findSpamTriggerWords(bodyText)]));

  async function handleSendTest() {
    setTestResult(null);
    setTestSending(true);
    try {
      const result = await sendTestEmail({ subject, preheader, headline, body_text: bodyText, cta_text: ctaText, cta_url: ctaUrl }, testEmail);
      setTestResult(result);
    } catch (err) {
      setTestResult({ ok: false, message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setTestSending(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const input: EmailTemplateInput = { name, category, subject, preheader, headline, body_text: bodyText, cta_text: ctaText, cta_url: ctaUrl, status };
    try {
      if (template) {
        await updateEmailTemplate(template.id, input);
      } else {
        await createEmailTemplate(input);
      }
      router.push("/admin/email/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setSubmitting(false);
    }
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Template Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Spring Restock Announcement" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as EmailTemplate["category"])} className={inputClass}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c[0].toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className={labelClass}>Subject Line *</label>
        <input value={subject} onChange={(e) => setSubject(e.target.value)} required placeholder="What's new at The Unique Choice" className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Preheader (inbox preview text)</label>
        <input
          value={preheader}
          onChange={(e) => setPreheader(e.target.value)}
          placeholder="A one-line teaser shown next to the subject in Gmail/Outlook"
          className={inputClass}
        />
      </div>

      <div>
        <label className={labelClass}>Headline *</label>
        <input value={headline} onChange={(e) => setHeadline(e.target.value)} required className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Body *</label>
        <textarea
          value={bodyText}
          onChange={(e) => setBodyText(e.target.value)}
          required
          rows={8}
          placeholder={"First paragraph.\n\nSecond paragraph — leave a blank line between paragraphs."}
          className={`resize-none ${inputClass}`}
        />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Button Text</label>
          <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Get a quote" className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Button URL</label>
          <input value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://theuniquechoice.com/en#consultation" className={inputClass} />
        </div>
      </div>

      <div>
        <label className={labelClass}>Status</label>
        <select value={status} onChange={(e) => setStatus(e.target.value as EmailTemplate["status"])} className={inputClass}>
          <option value="draft">Draft</option>
          <option value="active">Active — usable in a campaign</option>
        </select>
      </div>

      {spamWarnings.length > 0 && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            These phrases commonly trigger spam filters: <strong>{spamWarnings.join(", ")}</strong>. Worth rewording before sending.
          </span>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
        <p className="text-xs font-semibold text-gray-700">Send yourself a test — see the real rendered email before using this in a campaign</p>
        <div className="flex flex-wrap gap-2">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="you@company.com"
            className={`max-w-xs ${inputClass}`}
          />
          <Button type="button" variant="secondary" size="sm" disabled={testSending || !testEmail.trim() || !subject.trim() || !bodyText.trim()} onClick={handleSendTest}>
            <Send size={12} />
            {testSending ? "Sending..." : "Send test"}
          </Button>
        </div>
        {testResult && (
          <p className={`flex items-center gap-1.5 text-xs ${testResult.ok ? "text-emerald-600" : "text-red-500"}`}>
            {testResult.ok && <CheckCircle size={13} />}
            {testResult.message}
          </p>
        )}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <Button type="submit" disabled={submitting} className="mt-2 w-fit">
        {submitting ? "Saving..." : "Save template"}
      </Button>
    </form>
  );
}
