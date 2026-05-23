import { SEVERITY_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { AuditAlert } from "@/types/audit";

const styles = {
  low: "border-slate-200 bg-slate-50",
  medium: "border-amber-200 bg-amber-50",
  high: "border-orange-200 bg-orange-50",
  critical: "border-red-200 bg-red-50",
};

export function AlertCard({ alert }: { alert: AuditAlert }) {
  return (
    <div className={cn("rounded border p-3", styles[alert.severity])}>
      <div className="mb-1 flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-ink">{alert.type}</p>
        <span className="text-xs font-semibold uppercase tracking-wide text-steel">{SEVERITY_LABELS[alert.severity]}</span>
      </div>
      <p className="text-sm text-steel">{alert.message}</p>
      {(alert.expectedValue || alert.actualValue) && (
        <p className="mt-2 text-xs text-steel">
          Esperado: {alert.expectedValue ?? "N/D"} · Actual: {alert.actualValue ?? "N/D"}
        </p>
      )}
    </div>
  );
}
