import { CheckCircle2, XCircle } from "lucide-react";
import { getIntegrationsStatus } from "@/lib/actions/dashboard";
import { Card } from "@/components/admin/ui";

/** Every optional integration on this site degrades silently when its
 * env var is missing — the form still submits, nothing throws, and
 * nobody finds out until a customer asks why they never heard back.
 * This reads the same checks each integration already does for itself,
 * in one place, so that's visible instead of invisible. */
export default async function IntegrationsStatusCard() {
  const statuses = await getIntegrationsStatus();
  const missingCount = statuses.filter((s) => !s.configured).length;

  return (
    <Card className="p-0">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="font-admin-display text-sm font-semibold text-gray-900">Integrations</h2>
        <p className="mt-0.5 text-xs text-gray-500">
          {missingCount === 0
            ? "Every optional integration is configured."
            : `${missingCount} integration${missingCount === 1 ? " isn't" : "s aren't"} configured — each degrades quietly rather than breaking anything.`}
        </p>
      </div>
      <div className="flex flex-col divide-y divide-gray-100">
        {statuses.map((s) => (
          <div key={s.name} className="flex items-start gap-3 px-5 py-3.5">
            {s.configured ? (
              <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-500" />
            ) : (
              <XCircle size={15} className="mt-0.5 shrink-0 text-gray-300" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-gray-700">{s.name}</p>
              {!s.configured && <p className="text-xs text-gray-400">{s.detail}</p>}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
