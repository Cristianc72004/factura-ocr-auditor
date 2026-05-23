import { notFound } from "next/navigation";
import { AlertCard } from "@/components/AlertCard";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { InvoiceItemsTable } from "@/components/InvoiceItemsTable";
import { LayoutShell } from "@/components/LayoutShell";
import { getInvoice, listClaims } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ReviewForm } from "./review-form";

export default async function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await getInvoice(id);
  if (!invoice) notFound();
  const claims = await listClaims();
  const claim = claims.find((item) => item.claimNumber === invoice.claimNumber);

  return (
    <LayoutShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Detalle de caso</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">{invoice.invoiceNumber}</h1>
          <p className="mt-1 text-sm text-steel">Creado el {formatDate(invoice.createdAt)} · Riesgo {invoice.riskScore}/100</p>
        </div>
        <CaseStatusBadge status={invoice.status} />
      </div>
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          <section className="rounded border border-line bg-white p-5 shadow-subtle">
            <h2 className="mb-4 font-semibold text-ink">Datos de factura</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Siniestro" value={invoice.claimNumber} />
              <Info label="Taller" value={invoice.workshopName} />
              <Info label="Asegurado" value={invoice.insuredName} />
              <Info label="Vehículo" value={invoice.vehicle} />
              <Info label="Patente / placa" value={invoice.licensePlate} />
              <Info label="UUID" value={invoice.uuid || "Sin dato"} />
              <Info label="Subtotal" value={formatCurrency(invoice.subtotal)} />
              <Info label="IVA" value={formatCurrency(invoice.tax)} />
              <Info label="Total" value={formatCurrency(invoice.total)} />
            </div>
          </section>
          {claim && (
            <section className="rounded border border-line bg-white p-5 shadow-subtle">
              <h2 className="mb-4 font-semibold text-ink">Datos del siniestro</h2>
              <div className="grid gap-3 md:grid-cols-2">
                <Info label="Daño reportado" value={claim.reportedDamage} />
                <Info label="Servicios autorizados" value={claim.authorizedServices.join(", ")} />
                <Info label="Talleres autorizados" value={claim.authorizedWorkshopNames.join(", ")} />
                <Info label="Estado" value={claim.status} />
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-3 font-semibold text-ink">Ítems facturados</h2>
            <InvoiceItemsTable items={invoice.items} />
          </section>
          <section className="rounded border border-line bg-white p-5 shadow-subtle">
            <h2 className="mb-3 font-semibold text-ink">OCR bruto</h2>
            <pre className="max-h-72 overflow-auto rounded bg-surface p-3 text-sm text-steel whitespace-pre-wrap">{invoice.rawOcrText || "Sin texto OCR registrado."}</pre>
          </section>
        </div>
        <aside className="min-w-0 space-y-6">
          <section className="rounded border border-line bg-white p-5 shadow-subtle">
            <h2 className="mb-3 font-semibold text-ink">Alertas</h2>
            <div className="space-y-3">
              {invoice.alerts.length ? invoice.alerts.map((alert) => <AlertCard key={alert.id} alert={alert} />) : <p className="rounded bg-emerald-50 p-3 text-sm text-approved">Sin alertas.</p>}
            </div>
          </section>
          <ReviewForm invoiceId={invoice.id} currentStatus={invoice.status} />
          <section className="rounded border border-line bg-white p-5 shadow-subtle">
            <h2 className="mb-3 font-semibold text-ink">Historial humano</h2>
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
          </section>
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
