import { STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/types/invoice";

const styles = {
  approved: "bg-emerald-50 text-approved ring-emerald-200",
  observed: "bg-amber-50 text-observed ring-amber-200",
  rejected: "bg-red-50 text-rejected ring-red-200",
};

export function CaseStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={cn("inline-flex rounded px-2 py-1 text-xs font-semibold ring-1", styles[status])}>
      {STATUS_LABELS[status]}
    </span>
  );
}
