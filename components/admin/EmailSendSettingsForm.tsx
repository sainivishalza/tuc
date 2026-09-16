"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, PauseCircle, PlayCircle } from "lucide-react";
import { updateEmailSendSettings, pauseSending, resumeSending } from "@/lib/actions/emailCampaigns";
import type { EmailSendSettings } from "@/lib/supabase/types";
import { Button, inputClass, labelClass } from "@/components/admin/ui";

export default function EmailSendSettingsForm({ settings, isPaused }: { settings: EmailSendSettings; isPaused: boolean }) {
  const router = useRouter();
  const [maxPerHour, setMaxPerHour] = useState(settings.max_per_hour);
  const [maxPerBatch, setMaxPerBatch] = useState(settings.max_per_batch);
  const [failureThreshold, setFailureThreshold] = useState(settings.failure_pause_threshold_pct);
  const [pauseReason, setPauseReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await updateEmailSendSettings({ max_per_hour: maxPerHour, max_per_batch: maxPerBatch, failure_pause_threshold_pct: failureThreshold });
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePause() {
    setSaving(true);
    try {
      await pauseSending(pauseReason);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleResume() {
    setSaving(true);
    try {
      await resumeSending();
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {isPaused ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <PauseCircle size={15} />
            Sending is currently paused
          </p>
          <p className="text-xs text-amber-700">{settings.pause_reason}</p>
          <Button onClick={handleResume} disabled={saving} variant="secondary" size="sm" className="w-fit">
            <PlayCircle size={13} />
            Resume sending
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4">
          <p className="flex items-center gap-2 text-sm font-semibold text-gray-700">
            <ShieldAlert size={15} className="text-gray-400" />
            Manually pause sending
          </p>
          <input
            value={pauseReason}
            onChange={(e) => setPauseReason(e.target.value)}
            placeholder="Reason (optional, shown to admins)"
            className={inputClass}
          />
          <Button onClick={handlePause} disabled={saving} variant="secondary" size="sm" className="w-fit">
            <PauseCircle size={13} />
            Pause all sending
          </Button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Max emails / hour</label>
            <input
              type="number"
              min={1}
              value={maxPerHour}
              onChange={(e) => setMaxPerHour(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max per batch (one click)</label>
            <input
              type="number"
              min={1}
              value={maxPerBatch}
              onChange={(e) => setMaxPerBatch(Number(e.target.value))}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Auto-pause failure threshold %</label>
            <input
              type="number"
              min={1}
              max={100}
              value={failureThreshold}
              onChange={(e) => setFailureThreshold(Number(e.target.value))}
              className={inputClass}
            />
          </div>
        </div>
        <p className="text-xs text-gray-500">
          If a batch of 5+ sends fails at or above this rate, sending auto-pauses for an hour — a spike in failures usually means a
          bad address list or an API problem, not something worth burning your domain reputation over.
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={saving} size="sm" className="w-fit">
          {saving ? "Saving..." : "Save limits"}
        </Button>
      </form>
    </div>
  );
}
