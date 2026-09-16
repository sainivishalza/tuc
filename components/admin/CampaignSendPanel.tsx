"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Send, PauseCircle, AlertTriangle } from "lucide-react";
import { sendNextBatch } from "@/lib/actions/emailCampaigns";
import type { EmailCampaign } from "@/lib/supabase/types";
import { Button } from "@/components/admin/ui";

export default function CampaignSendPanel({ campaign, isPaused }: { campaign: EmailCampaign; isPaused: boolean }) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState("");
  const remaining = campaign.total_recipients - campaign.sent_count - campaign.failed_count;

  async function handleSendBatch() {
    setSending(true);
    setNotice("");
    try {
      const result = await sendNextBatch(campaign.id);
      if (result.paused) {
        setNotice(`Sending is paused: ${result.pauseReason ?? "manually paused"}`);
      } else if (result.hourlyLimitReached) {
        setNotice("This hour's sending limit has been reached — try again after the top of the next hour.");
      } else {
        setNotice(`Sent ${result.sentThisBatch}, failed ${result.failedThisBatch}. ${result.remaining} left.`);
        if (result.paused) setNotice((n) => `${n} Sending auto-paused — see the banner above.`);
      }
      router.refresh();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setSending(false);
    }
  }

  if (campaign.status === "completed") {
    return <p className="text-sm text-emerald-600">All recipients have been processed.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {isPaused ? (
        <p className="flex items-center gap-2 text-sm text-amber-700">
          <PauseCircle size={15} />
          Sending is paused — resolve this in Email Sending Settings before continuing.
        </p>
      ) : (
        <Button onClick={handleSendBatch} disabled={sending || remaining <= 0} className="w-fit">
          <Send size={14} />
          {sending ? "Sending..." : `Send next batch (${Math.min(remaining, 9999)} left)`}
        </Button>
      )}
      {notice && (
        <p className="flex items-start gap-2 text-xs text-gray-600">
          <AlertTriangle size={13} className="mt-0.5 shrink-0 text-gray-400" />
          {notice}
        </p>
      )}
    </div>
  );
}
