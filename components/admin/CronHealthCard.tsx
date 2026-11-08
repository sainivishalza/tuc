import { CheckCircle2, AlertTriangle } from "lucide-react";
import { getCronRunsStatus } from "@/lib/actions/dashboard";
import { Card } from "@/components/admin/ui";

const JOB_LABEL: Record<string, string> = {
  digest: "Daily digest & follow-ups",
  "send-scheduled-campaigns": "Scheduled campaign sender",
};

/** There is no scheduler inside this app — both jobs only run when an
 * external Hostinger Cron Job calls back in (see app/api/cron/*). This
 * is the only visibility staff have into whether that's still happening,
 * so it sits on the dashboard every admin already lands on. */
export default async function CronHealthCard() {
  const statuses = await getCronRunsStatus();
  const anyStale = statuses.some((s) => s.stale);

  return (
    <Card className="p-0">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-admin-display text-sm font-semibold text-gray-900">Scheduled jobs</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {anyStale
            ? "At least one job hasn't checked in recently — the Hostinger Cron Job calling it may have stopped."
            : "Both jobs are checking in on schedule."}
        </p>
      </div>
      <div className="flex flex-col divide-y divide-gray-100">
        {statuses.map((s) => (
          <div key={s.name} className="flex items-start gap-3 px-5 py-3.5">
            {s.stale ? (
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-500" />
            ) : (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">{JOB_LABEL[s.name] ?? s.name}</p>
              <p className="text-xs text-gray-400">
                {s.lastRunAt
                  ? `Last ran ${new Date(s.lastRunAt).toLocaleString()}${s.lastOk === false ? " — failed" : ""}`
                  : "Never run — check the Hostinger Cron Job is set up (hPanel > Advanced > Cron Jobs)."}
              </p>
              {s.lastError && <p className="mt-1 text-xs text-red-500">{s.lastError}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
