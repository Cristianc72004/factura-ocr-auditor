import { AlertTriangle, CheckCircle2, FileText, XCircle } from "lucide-react";
import type { InvoiceRecord } from "@/types/invoice";

export function DashboardStats({ cases }: { cases: InvoiceRecord[] }) {
  const total = Math.max(cases.length, 1);
  const stats = [
    { label: "Facturas", value: cases.length, icon: FileText, color: "bg-navy", percent: 100 },
    { label: "Aprobadas", value: cases.filter((item) => item.status === "approved").length, icon: CheckCircle2, color: "bg-approved", percent: (cases.filter((item) => item.status === "approved").length / total) * 100 },
    { label: "Observadas", value: cases.filter((item) => item.status === "observed").length, icon: AlertTriangle, color: "bg-observed", percent: (cases.filter((item) => item.status === "observed").length / total) * 100 },
    { label: "Rechazadas", value: cases.filter((item) => item.status === "rejected").length, icon: XCircle, color: "bg-rejected", percent: (cases.filter((item) => item.status === "rejected").length / total) * 100 },
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className="rounded border border-line bg-white p-5 shadow-subtle">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-steel">{stat.label}</p>
              <Icon className="size-5 text-navy" />
            </div>
            <p className="text-3xl font-semibold text-ink">{stat.value}</p>
            <div className="mt-4 h-2 overflow-hidden rounded bg-line">
              <div className={`h-full rounded ${stat.color}`} style={{ width: `${Math.max(0, Math.min(100, stat.percent))}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
