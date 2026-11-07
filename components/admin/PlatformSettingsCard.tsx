"use client";

import { useState, useTransition } from "react";
import { updatePlatformSettings } from "@/lib/actions/sourcingRequests";
import type { PlatformSettings } from "@/lib/supabase/types";
import { Card, Button, inputClass, labelClass } from "@/components/admin/ui";

export default function PlatformSettingsCard({ settings }: { settings: PlatformSettings }) {
  const [connectMode, setConnectMode] = useState(settings.connect_mode);
  const [monetizationMode, setMonetizationMode] = useState(settings.monetization_mode);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    setSaved(false);
    startTransition(async () => {
      await updatePlatformSettings({ connect_mode: connectMode, monetization_mode: monetizationMode });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h3 className="font-admin-display text-sm font-semibold text-gray-900">Marketplace Settings</h3>
        <p className="mt-1 text-xs text-gray-500">Controls how suppliers connect with customers who post a sourcing request.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>How suppliers connect</label>
          <select value={connectMode} onChange={(e) => setConnectMode(e.target.value as typeof connectMode)} className={inputClass}>
            <option value="direct">Direct — supplier contacts customer immediately</option>
            <option value="staff_mediated" disabled>
              Staff-mediated introduction (coming soon)
            </option>
            <option value="platform_chat" disabled>
              In-platform chat, no contact shared (coming soon)
            </option>
          </select>
        </div>
        <div>
          <label className={labelClass}>Monetization</label>
          <select value={monetizationMode} onChange={(e) => setMonetizationMode(e.target.value as typeof monetizationMode)} className={inputClass}>
            <option value="free">Free for everyone</option>
            <option value="supplier_paid" disabled>
              Suppliers pay to respond (coming soon)
            </option>
            <option value="commission" disabled>
              Commission on deals (coming soon)
            </option>
          </select>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={handleSave} disabled={isPending}>
          {isPending ? "Saving…" : "Save settings"}
        </Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </Card>
  );
}
