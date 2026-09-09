"use client";

import { useState } from "react";
import { purgeCdnCache } from "@/lib/actions/hostinger";
import { Button, Card } from "@/components/admin/ui";

export default function PurgeCacheButton() {
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function handleClick() {
    setState("loading");
    setResult(null);
    try {
      const res = await purgeCdnCache();
      setResult(res);
    } catch (err) {
      setResult({ ok: false, message: err instanceof Error ? err.message : "Something went wrong." });
    } finally {
      setState("done");
    }
  }

  return (
    <Card className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 className="font-admin-display text-sm font-semibold text-gray-900">Site cache</h2>
        <p className="mt-1 text-sm text-gray-500">
          The CDN also purges automatically on every deploy. Use this if the live site ever looks stale
          (missing styles, old content) between deploys.
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <Button type="button" variant="secondary" size="sm" onClick={handleClick} disabled={state === "loading"}>
          {state === "loading" ? "Purging..." : "Purge CDN cache"}
        </Button>
        {result && (
          <p className={`text-xs ${result.ok ? "text-emerald-600" : "text-red-500"}`}>{result.message}</p>
        )}
      </div>
    </Card>
  );
}
