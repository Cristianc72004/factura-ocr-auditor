import { notFound } from "next/navigation";
import { AlertCard } from "@/components/AlertCard";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { CollapsedTextBlock } from "@/components/CollapsedTextBlock";
import { InvoiceItemsTable } from "@/components/InvoiceItemsTable";
import { LayoutShell } from "@/components/LayoutShell";
import { RiskMeter, WorkflowSteps } from "@/components/VisualIndicators";
import { getInvoice, listClaims, listPolicies } from "@/lib/db";
import { CLAIM_STATUS_LABELS, labelFromMap } from "@/lib/labels";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClaimFromInvoiceForm } from "./claim-from-invoice-form";
import { ReviewForm } from "./review-form";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const [claims, policies] = await Promise.all([listClaims(), listPolicies()]);
  const claim = claims.find((item) => item.claimNumber === invoice.claimNumber);
  const caseSteps = [
    { label: "Factura", status: "done" as const },
    { label: "Siniestro", status: claim ? "done" as const : "current" as const },
    { label: "Reglas", status: "done" as const },
    { label: "Revision", status: invoice.status === "rejected" ? "blocked" as const : invoice.status === "observed" ? "current" as const : "done" as const },
  ];

  return (
    <LayoutShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Detalle de caso</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">{invoice.invoiceNumber}</h1>
          <p className="mt-1 text-sm text-steel">Creado el {formatDate(invoice.createdAt)} - Riesgo {invoice.riskScore}/100</p>
        </div>
        <CaseStatusBadge status={invoice.status} />
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
        <WorkflowSteps steps={caseSteps} />
        <div className="rounded border border-line bg-white p-4 shadow-subtle">
          <RiskMeter score={invoice.riskScore} />
        </div>
      </div>

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-4">
          <CollapsibleSection title="Datos de factura" summary={`${invoice.workshopName} - ${formatCurrency(invoice.total)}`} defaultOpen>
            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Siniestro" value={invoice.claimNumber} />
              <Info label="Taller" value={invoice.workshopName} />
              <Info label="Asegurado" value={invoice.insuredName} />
              <Info label="Vehiculo" value={invoice.vehicle} />
              <Info label="Patente / placa" value={invoice.licensePlate} />
              <Info label="UUID" value={invoice.uuid || "Sin dato"} />
              <Info label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <Info label="IVA" value={formatCurrency(invoice.tax)} />
              <Info label="Total" value={formatCurrency(invoice.total)} />
            </div>
          </CollapsibleSection>

          {claim ? (
            <CollapsibleSection title="Datos del siniestro" summary={cleanText(claim.reportedDamage)} defaultOpen>
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Dano reportado" value={cleanText(claim.reportedDamage)} />
                <Info label="Factura informada" value={claim.invoiceNumber || "Sin dato"} />
                <Info label="Servicios autorizados" value={claim.authorizedServices.map(cleanText).join(", ")} />
                <Info label="Talleres autorizados" value={claim.authorizedWorkshopNames.join(", ")} />
                <Info label="Estado" value={labelFromMap(CLAIM_STATUS_LABELS, claim.status)} />
              </div>
            </CollapsibleSection>
          ) : (
            <ClaimFromInvoiceForm invoice={invoice} policies={policies} />
          )}

          <CollapsibleSection title="Items facturados" summary={`${invoice.items.length} item(s)`}>
            <InvoiceItemsTable items={invoice.items} />
          </CollapsibleSection>

          <CollapsedTextBlock title="Texto reconocido" text={invoice.rawOcrText} emptyText="Sin texto reconocido registrado." />
        </div>

        <aside className="min-w-0 space-y-4">
          <CollapsibleSection title="Alertas" summary={`${invoice.alerts.length} alerta(s)`} defaultOpen>
            <div className="space-y-3">
              {invoice.alerts.length ? invoice.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />) : <p className="rounded bg-emerald-50 p-3 text-sm text-approved">Sin alertas.</p>}
            </div>
          </CollapsibleSection>

          <ReviewForm invoiceId={invoice.id} currentStatus={invoice.status} />

          <CollapsibleSection title="Historial humano" summary={`${invoice.reviews?.length ?? 0} decision(es)`}>
            <div className="space-y-3">
              {invoice.reviews?.length ? invoice.reviews.map((review) => (
                <div key={review.id} className="rounded border border-line p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="font-semibold text-ink">{review.reviewerName}</span>
                    <CaseStatusBadge status={review.decision} />
                  </div>
                  <p className="text-steel">{review.comment}</p>
                  <p className="mt-2 text-xs text-steel">{formatDate(review.reviewedAt)}</p>
                </div>
              )) : <p className="text-sm text-steel">Sin decisiones manuales registradas.</p>}
            </div>
          </CollapsibleSection>
        </aside>
      </div>
    </LayoutShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function cleanText(value: string) {
  return value
    .replace(/\bdano\b/gi, "dano")
    .replace(/\boptica\b/gi, "optica")
    .replace(/\brevision\b/gi, "revision")
    .replace(/\bDiagnostico\b/g, "Diagnostico")
    .replace(/\bAlineacion\b/g, "Alineacion");
}
