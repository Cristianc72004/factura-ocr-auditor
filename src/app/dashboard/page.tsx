import Link from "next/link";
import { ArrowRight, FileSearch, ShieldAlert, TableProperties, UploadCloud, Users, Wrench } from "lucide-react";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { DashboardStats } from "@/components/DashboardStats";
import { LayoutShell } from "@/components/LayoutShell";
import { StatusHint, WorkflowSteps } from "@/components/VisualIndicators";
import { listClaims, listInvoices, listPolicies, listTariffs, listWorkshops } from "@/lib/db";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function DashboardPage() {
  const [cases, tariffs] = await Promise.all([listInvoices(), listTariffs()]);
  const [claims, policies, workshops] = await Promise.all([listClaims(), listPolicies(), listWorkshops()]);
  const criticalAlerts = cases.reduce((total, item) => total + item.alerts.filter((alert) => alert.severity === "critical").length, 0);
  const recent = cases.slice(0, 5);
  const authorizedTariffs = tariffs.filter((item) => item.authorized).length;
  const openClaims = claims.filter((item) => item.status !== "closed").length;
  const flowSteps = [
    { label: "Polizas", status: policies.length ? "done" : "current" },
    { label: "Siniestros", status: claims.length ? "done" : "pending" },
    { label: "Convenios", status: workshops.length ? "done" : "pending" },
    { label: "Auditorias", status: cases.length ? "done" : "current" },
  ] as const;

  return (
    <LayoutShell>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-steel">Panel administrativo</p>
          <h1 className="mt-1 text-3xl font-semibold text-ink">Validacion de facturas por poliza, siniestro y convenio</h1>
        </div>
        <Link className="focus-ring rounded bg-navy px-4 py-2 text-sm font-semibold text-white" href="/upload">
          Auditar factura
        </Link>
      </div>

      <section className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] gap-4">
        <ControlCard icon={<Users className="size-5" />} title="1. Cliente y poliza" value={`${policies.length} polizas`} detail="Titular, vehiculo, placa, cobertura, deducible y limite." href="/clients" />
        <ControlCard icon={<ShieldAlert className="size-5" />} title="2. Reporte del cliente" value={`${claims.length} reportes`} detail={`${openClaims} abiertos o en revisión con factura informada.`} href="/claims" />
        <ControlCard icon={<UploadCloud className="size-5" />} title="3. Factura del taller" value="OCR + datos" detail="Documento del taller para contrastar contra el reporte." href="/upload" />
        <ControlCard icon={<Wrench className="size-5" />} title="4. Taller" value={`${workshops.length} convenios`} detail="Taller habilitado, hora de mano de obra y categorias." href="/workshops" />
        <ControlCard icon={<TableProperties className="size-5" />} title="5. Tarifario" value={`${tariffs.length} conceptos`} detail={`${authorizedTariffs} conceptos autorizados para precios y horas.`} href="/tariffs" />
        <ControlCard icon={<FileSearch className="size-5" />} title="6. Revision" value={`${cases.length} casos`} detail="Solo observadas o rechazadas pasan a auditor humano." href="/cases" />
      </section>

      <div className="mb-6">
        <WorkflowSteps steps={flowSteps.map((step) => ({ label: step.label, status: step.status }))} />
      </div>

      <DashboardStats cases={cases} />

      <div className="mt-6 grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded border border-line bg-white shadow-subtle">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold text-ink">Casos auditados recientes</h2>
            <Link className="text-sm font-semibold text-navy" href="/cases">Ver casos</Link>
          </div>
          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-full text-left text-sm">
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
                    <td className="px-5 py-3 font-medium text-navy"><Link href={`/cases/${item.id}`}>{item.invoiceNumber}</Link></td>
                    <td className="px-5 py-3 text-steel">{item.claimNumber}</td>
                    <td className="px-5 py-3 text-steel">{item.workshopName}</td>
                    <td className="px-5 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                    <td className="px-5 py-3"><CaseStatusBadge status={item.status} /></td>
                    <td className="px-5 py-3 text-steel">{formatDate(item.createdAt)}</td>
                  </tr>
                ))}
                {!recent.length && (
                  <tr>
                    <td className="px-5 py-8 text-center text-steel" colSpan={6}>
                      No hay facturas auditadas.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0 space-y-4">
          <StatusHint tone={criticalAlerts ? "danger" : "success"} title="Alertas criticas" value={`${criticalAlerts} registradas`} />
          <StatusHint tone={policies.length && claims.length && workshops.length && tariffs.length ? "success" : "warning"} title="Base operativa" value={`${policies.length + claims.length + workshops.length + tariffs.length} registros listos`} />
          <StatusHint tone={openClaims ? "info" : "warning"} title="Siniestros activos" value={`${openClaims} abiertos o en revision`} />
        </section>
      </div>
    </LayoutShell>
  );
}

function ControlCard({ icon, title, value, detail, href }: { icon: React.ReactNode; title: string; value: string; detail: string; href: string }) {
  return (
    <Link className="group min-w-0 rounded border border-line bg-white p-5 shadow-subtle transition hover:border-navy/40" href={href}>
      <div className="mb-4 flex items-center justify-between">
        <div className="grid size-10 place-items-center rounded bg-surface text-navy">{icon}</div>
        <ArrowRight className="size-4 text-steel transition group-hover:translate-x-1 group-hover:text-navy" />
      </div>
      <p className="text-sm font-semibold text-steel">{title}</p>
      <p className="mt-2 break-words text-2xl font-semibold text-ink">{value}</p>
      <p className="mt-2 text-sm text-steel">{detail}</p>
    </Link>
  );
}
