import { AlertCard } from "@/components/AlertCard";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { InvoiceItemsTable } from "@/components/InvoiceItemsTable";
import { formatCurrency } from "@/lib/utils";
import type { AuditReport as AuditReportType } from "@/types/audit";

export function AuditReport({ report }: { report: AuditReportType }) {
  return (
    <div className="space-y-4 rounded border border-line bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Reporte automático</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Estado de auditoría</h2>
        </div>
        <CaseStatusBadge status={report.status} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <div className="rounded bg-surface p-3"><p className="text-xs text-steel">Factura</p><p className="font-semibold">{report.invoice.invoiceNumber || "Sin dato"}</p></div>
        <div className="rounded bg-surface p-3"><p className="text-xs text-steel">Siniestro</p><p className="font-semibold">{report.invoice.claimNumber || "Sin dato"}</p></div>
        <div className="rounded bg-surface p-3"><p className="text-xs text-steel">Riesgo</p><p className="font-semibold">{report.riskScore}/100</p></div>
        <div className="rounded bg-surface p-3"><p className="text-xs text-steel">Total</p><p className="font-semibold">{formatCurrency(report.invoice.total)}</p></div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-ink">Discrepancias detectadas</h3>
        <div className="grid gap-3">
          {report.alerts.length ? report.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />) : <p className="rounded bg-emerald-50 p-3 text-sm text-approved">No se detectaron discrepancias relevantes.</p>}
        </div>
      </div>
      <InvoiceItemsTable items={report.invoice.items} />
      <div className="rounded bg-surface p-4 text-sm text-steel">
        <p><strong className="text-ink">Subtotal calculado:</strong> {formatCurrency(report.calculatedSubtotal)}</p>
        <p><strong className="text-ink">IVA calculado:</strong> {formatCurrency(report.calculatedTax)}</p>
        <p><strong className="text-ink">Total calculado:</strong> {formatCurrency(report.calculatedTotal)}</p>
        <p className="mt-3"><strong className="text-ink">Recomendación:</strong> {report.recommendation}</p>
      </div>
    </div>
  );
}
