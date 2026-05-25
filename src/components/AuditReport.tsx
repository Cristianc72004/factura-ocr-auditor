import { AlertCard } from "@/components/AlertCard";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { InvoiceItemsTable } from "@/components/InvoiceItemsTable";
import { RiskMeter, WorkflowSteps } from "@/components/VisualIndicators";
import { formatCurrency } from "@/lib/utils";
import type { AuditReport as AuditReportType } from "@/types/audit";

export function AuditReport({ report }: { report: AuditReportType }) {
  const auditSteps = [
    { label: "Factura", status: "done" as const },
    { label: "Tarifario", status: "done" as const },
    { label: "Reglas", status: "done" as const },
    { label: report.status === "approved" ? "Aprobada" : report.status === "observed" ? "Observada" : "Rechazada", status: report.status === "rejected" ? "blocked" as const : "done" as const },
  ];
  return (
    <div className="space-y-4 rounded border border-line bg-white p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Reporte automatico</p>
          <h2 className="mt-1 text-2xl font-semibold text-ink">Estado de auditoria</h2>
          <p className="mt-1 text-sm text-steel">Este estado decide la revision o pago. Es independiente de la confianza OCR.</p>
        </div>
        <CaseStatusBadge status={report.status} />
      </div>
      <div className="grid gap-3 md:grid-cols-4">
        <Info label="Factura" value={report.invoice.invoiceNumber || "Sin dato"} />
        <Info label="Siniestro" value={report.invoice.claimNumber || "Sin dato"} />
        <div className="rounded bg-surface p-3"><RiskMeter score={report.riskScore} /></div>
        <Info label="Total" value={formatCurrency(report.invoice.total)} />
      </div>
      <WorkflowSteps steps={auditSteps} />

      <CollapsibleSection title="Discrepancias detectadas" summary={`${report.alerts.length} alerta(s)`} defaultOpen>
        <div className="grid gap-3">
          {report.alerts.length ? report.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />) : <p className="rounded bg-emerald-50 p-3 text-sm text-approved">No se detectaron discrepancias relevantes.</p>}
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Items facturados" summary={`${report.invoice.items.length} item(s)`}>
        <InvoiceItemsTable items={report.invoice.items} />
      </CollapsibleSection>

      <CollapsibleSection title="Calculos y recomendacion" summary={report.recommendation}>
        <div className="rounded bg-surface p-4 text-sm text-steel">
          <p><strong className="text-ink">Subtotal calculado:</strong> {formatCurrency(report.calculatedSubtotal)}</p>
          <p><strong className="text-ink">IVA calculado:</strong> {formatCurrency(report.calculatedTax)}</p>
          <p><strong className="text-ink">Total calculado:</strong> {formatCurrency(report.calculatedTotal)}</p>
          <p className="mt-3"><strong className="text-ink">Recomendacion:</strong> {report.recommendation}</p>
        </div>
      </CollapsibleSection>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface p-3">
      <p className="text-xs text-steel">{label}</p>
      <p className="font-semibold">{value}</p>
    </div>
  );
}
