"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Eye, Search } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { CaseStatusBadge } from "@/components/CaseStatusBadge";
import { DetailModal } from "@/components/DetailModal";
import { AlertCard } from "@/components/AlertCard";
import { InvoiceItemsTable } from "@/components/InvoiceItemsTable";
import { RiskMeter } from "@/components/VisualIndicators";
import { formatCurrency, formatDate, normalizeText } from "@/lib/utils";
import type { InvoiceRecord, InvoiceStatus } from "@/types/invoice";

export default function CasesPage() {
  const [cases, setCases] = useState<InvoiceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<InvoiceStatus | "all">("all");
  const [selected, setSelected] = useState<InvoiceRecord | null>(null);

  useEffect(() => {
    fetch("/api/cases")
      .then((response) => response.json())
      .then((data) => setCases(data.cases || []));
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return cases.filter((item) => {
      const matchesStatus = status === "all" || item.status === status;
      const haystack = normalizeText(`${item.invoiceNumber} ${item.claimNumber} ${item.workshopName} ${item.insuredName}`);
      return matchesStatus && (!q || haystack.includes(q));
    });
  }, [cases, query, status]);

  return (
    <LayoutShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Revisión humana</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Casos auditados</h1>
      </div>
      <div className="mb-4 grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <label className="relative">
          <Search className="pointer-events-none absolute left-3 top-2.5 size-4 text-steel" />
          <input className="w-full rounded border border-line bg-white py-2 pl-10 pr-3 focus-ring" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por factura, siniestro, taller o asegurado" />
        </label>
        <select className="rounded border border-line bg-white px-3 py-2 focus-ring" value={status} onChange={(event) => setStatus(event.target.value as InvoiceStatus | "all")}>
          <option value="all">Todos los estados</option>
          <option value="approved">Aprobadas</option>
          <option value="observed">Observadas</option>
          <option value="rejected">Rechazadas</option>
        </select>
      </div>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel">
            <tr>
              <th className="px-5 py-3">Factura</th>
              <th className="px-5 py-3">Siniestro</th>
              <th className="px-5 py-3">Taller</th>
              <th className="px-5 py-3">Asegurado</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Riesgo</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {filtered.map((item) => (
              <tr key={item.id}>
                <td className="px-5 py-3 font-medium text-navy"><Link href={`/cases/${item.id}`}>{item.invoiceNumber}</Link></td>
                <td className="px-5 py-3 text-steel">{item.claimNumber}</td>
                <td className="px-5 py-3 text-steel">{item.workshopName}</td>
                <td className="px-5 py-3 text-steel">{item.insuredName}</td>
                <td className="px-5 py-3 text-right font-semibold">{formatCurrency(item.total)}</td>
                <td className="px-5 py-3"><RiskMeter score={item.riskScore} /></td>
                <td className="px-5 py-3"><CaseStatusBadge status={item.status} /></td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="grid size-9 place-items-center rounded border border-line text-navy" type="button" title="Vista rapida" onClick={() => setSelected(item)}>
                      <Eye className="size-4" />
                    </button>
                    <Link className="rounded bg-navy px-3 py-2 text-xs font-semibold text-white" href={`/cases/${item.id}`}>
                      Abrir
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <DetailModal title={selected ? `Caso ${selected.invoiceNumber}` : "Caso"} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-4">
              <Info label="Siniestro" value={selected.claimNumber} />
              <Info label="Taller" value={selected.workshopName} />
              <Info label="Total" value={formatCurrency(selected.total)} />
              <Info label="Fecha" value={formatDate(selected.createdAt)} />
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-ink">Alertas principales</h3>
              <div className="grid gap-3">
                {selected.alerts.length ? selected.alerts.slice(0, 3).map((alert) => <AlertCard key={alert.id} alert={alert} />) : <p className="rounded bg-emerald-50 p-3 text-sm text-approved">Sin alertas.</p>}
              </div>
            </div>
            <div>
              <h3 className="mb-2 font-semibold text-ink">Items cobrados</h3>
              <InvoiceItemsTable items={selected.items} />
            </div>
            <div className="flex justify-end">
              <Link className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" href={`/cases/${selected.id}`}>
                Abrir detalle completo
              </Link>
            </div>
          </div>
        )}
      </DetailModal>
    </LayoutShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}
