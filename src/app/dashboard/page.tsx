import Link from "next/link";
import { LayoutShell } from "@/components/LayoutShell";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { DashboardStats } from "@/components/DashboardStats";
import { listInvoices } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const cases = await listInvoices();
  const criticalAlerts = cases.reduce((total, item) => total + item.alerts.filter((alert) => alert.severity === "critical").length, 0);
  const recent = cases.slice(0, 5);

  return (
    <LayoutShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Panel de auditoría</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Control de facturación de siniestros</h1>
        </div>
        <Link className="focus-ring rounded bg-navy px-4 py-2 text-sm font-semibold text-white" href="/upload">
          Auditar factura
        </Link>
      </div>
      <DashboardStats cases={cases} />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="rounded border border-line bg-white shadow-subtle">
          <div className="border-b border-line px-5 py-4">
            <h2 className="font-semibold text-ink">Casos recientes</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-surface text-xs uppercase text-steel">
                <tr>
                  <th className="px-5 py-3">Factura</th>
                  <th className="px-5 py-3">Siniestro</th>
                  <th className="px-5 py-3">Taller</th>
                  <th className="px-5 py-3 text-right">Total</th>
                  <th className="px-5 py-3">Estado</th>
                  <th className="px-5 py-3">Fecha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {recent.map((item) => (
                  <tr key={item.id}>
                    <td className="px-5 py-3 font-medium text-navy">
                      <Link href={`/cases/${item.id}`}>{item.invoiceNumber}</Link>
                    </td>
                    <td className="px-5 py-3 text-steel">{item.claimNumber}</td>
                    <td className="px-5 py-3 text-steel">{item.workshopName}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                    <td className="px-5 py-3"><CaseStatusBadge status={item.status} /></td>
                    <td className="px-5 py-3 text-steel">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="rounded border border-line bg-white p-5 shadow-subtle">
          <p className="text-sm font-medium text-steel">Alertas críticas</p>
          <p className="mt-3 text-4xl font-semibold text-rejected">{criticalAlerts}</p>
          <p className="mt-3 text-sm text-steel">Los casos con duplicado crítico se clasifican automáticamente como rechazados para prevenir pagos repetidos.</p>
        </section>
      </div>
    </LayoutShell>
  );
}
