"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { InvoiceRecord } from "@/types/invoice";
import type { InsurancePolicy } from "@/types/policy";

function csv(value: string[]) {
  return value.join(", ");
}

function list(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function ClaimFromInvoiceForm({
  invoice,
  policies,
}: {
  invoice: InvoiceRecord;
  policies: InsurancePolicy[];
}) {
  const router = useRouter();
  const inferredPolicy = useMemo(() => {
    const plate = invoice.licensePlate.toLowerCase();
    const insured = invoice.insuredName.toLowerCase();
    return policies.find((policy) => policy.licensePlate.toLowerCase() === plate)
      ?? policies.find((policy) => policy.clientName.toLowerCase() === insured)
      ?? policies[0];
  }, [invoice.insuredName, invoice.licensePlate, policies]);

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState({
    claimNumber: invoice.claimNumber,
    invoiceNumber: invoice.invoiceNumber,
    policyNumber: inferredPolicy?.policyNumber ?? "",
    insurerName: inferredPolicy?.insurerName ?? "Seguros del Norte S.A.",
    insuredName: invoice.insuredName,
    vehicle: invoice.vehicle,
    licensePlate: invoice.licensePlate,
    accidentDate: invoice.date || new Date().toISOString().slice(0, 10),
    reportedDamage: "",
    authorizedServices: csv(invoice.items.map((item) => item.description)),
    authorizedWorkshopNames: invoice.workshopName,
    estimatedRepairAmount: invoice.total,
    status: "under_review",
  });

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          authorizedServices: list(draft.authorizedServices),
          authorizedWorkshopNames: list(draft.authorizedWorkshopNames),
          estimatedRepairAmount: Number(draft.estimatedRepairAmount),
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo registrar el siniestro.");

      await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          invoiceId: invoice.id,
          invoice: {
            invoiceNumber: invoice.invoiceNumber,
            claimNumber: invoice.claimNumber,
            workshopName: invoice.workshopName,
            insuredName: invoice.insuredName,
            vehicle: invoice.vehicle,
            licensePlate: invoice.licensePlate,
            date: invoice.date,
            uuid: invoice.uuid,
            subtotal: invoice.subtotal,
            tax: invoice.tax,
            total: invoice.total,
            items: invoice.items,
          },
          rawOcrText: invoice.rawOcrText,
          fileName: invoice.fileName,
        }),
      });

      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded border border-line bg-white p-5 shadow-subtle">
      <h2 className="mb-4 font-semibold text-ink">Registrar siniestro</h2>
      {error && <p className="mb-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-rejected">{error}</p>}
      <div className="grid gap-3 md:grid-cols-2">
        <Input label="Siniestro" value={draft.claimNumber} onChange={(value) => setDraft({ ...draft, claimNumber: value })} />
        <Input label="Factura" value={draft.invoiceNumber} onChange={(value) => setDraft({ ...draft, invoiceNumber: value })} />
        <Input label="Póliza" value={draft.policyNumber} onChange={(value) => setDraft({ ...draft, policyNumber: value })} />
        <Input label="Asegurado" value={draft.insuredName} onChange={(value) => setDraft({ ...draft, insuredName: value })} />
        <Input label="Vehículo" value={draft.vehicle} onChange={(value) => setDraft({ ...draft, vehicle: value })} />
        <Input label="Placa" value={draft.licensePlate} onChange={(value) => setDraft({ ...draft, licensePlate: value })} />
        <Input label="Estimado" type="number" value={draft.estimatedRepairAmount} onChange={(value) => setDraft({ ...draft, estimatedRepairAmount: Number(value) })} />
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-steel">Daño reportado</span>
          <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={draft.reportedDamage} onChange={(event) => setDraft({ ...draft, reportedDamage: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-steel">Servicios autorizados</span>
          <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={draft.authorizedServices} onChange={(event) => setDraft({ ...draft, authorizedServices: event.target.value })} />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="mb-1 block font-medium text-steel">Taller autorizado</span>
          <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={draft.authorizedWorkshopNames} onChange={(event) => setDraft({ ...draft, authorizedWorkshopNames: event.target.value })} />
        </label>
      </div>
      <button className="mt-4 rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy} onClick={save}>
        Guardar y reauditar
      </button>
    </section>
  );
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: string | number; onChange: (value: string) => void; type?: string }) {
  return (
    <label className="text-sm">
      <span className="mb-1 block font-medium text-steel">{label}</span>
      <input className="w-full rounded border border-line px-3 py-2 focus-ring" type={type} value={String(value ?? "")} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}
