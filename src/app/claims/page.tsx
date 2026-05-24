"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { formatCurrency } from "@/lib/utils";
import type { Claim } from "@/types/claim";

const blank: Partial<Claim> = { insurerName: "Seguros del Norte S.A.", status: "open", authorizedServices: [], authorizedWorkshopNames: [], accidentDate: new Date().toISOString().slice(0, 10) };
const csv = (value?: string[]) => value?.join(", ") ?? "";
const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [draft, setDraft] = useState<Partial<Claim>>(blank);

  useEffect(() => { fetch("/api/claims").then((r) => r.json()).then((d) => setClaims(d.claims || [])); }, []);

  async function save() {
    const response = await fetch("/api/claims", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    setClaims([data.claim, ...claims.filter((item) => item.id !== data.claim.id)]);
    setDraft(blank);
  }

  async function remove(id: string) {
    await fetch(`/api/claims?id=${id}`, { method: "DELETE" });
    setClaims(claims.filter((item) => item.id !== id));
  }

  return (
    <LayoutShell>
      <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-steel">Reporte del cliente</p><h1 className="mt-1 text-3xl font-semibold text-ink">Siniestros reportados</h1></div>
      <section className="mb-6 rounded border border-line bg-white p-4 shadow-subtle">
        <h2 className="mb-3 font-semibold text-ink">{draft.id ? "Editar siniestro" : "Nuevo siniestro"}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          <Input label="Numero de siniestro" placeholder="Ej: 01234567" value={draft.claimNumber} onChange={(v) => setDraft({ ...draft, claimNumber: v })} />
          <Input label="Factura informada" placeholder="Ej: 0001-00001234" value={draft.invoiceNumber} onChange={(v) => setDraft({ ...draft, invoiceNumber: v })} />
          <Input label="Poliza asociada" placeholder="Ej: POL-AR-2024-0001" value={draft.policyNumber} onChange={(v) => setDraft({ ...draft, policyNumber: v })} />
          <Input label="Aseguradora" value={draft.insurerName} onChange={(v) => setDraft({ ...draft, insurerName: v })} />
          <Input label="Asegurado" placeholder="Ej: Juan Perez" value={draft.insuredName} onChange={(v) => setDraft({ ...draft, insuredName: v })} />
          <Input label="Vehiculo siniestrado" value={draft.vehicle} onChange={(v) => setDraft({ ...draft, vehicle: v })} />
          <Input label="Placa / dominio" value={draft.licensePlate} onChange={(v) => setDraft({ ...draft, licensePlate: v })} />
          <Input label="Fecha accidente" type="date" value={draft.accidentDate} onChange={(v) => setDraft({ ...draft, accidentDate: v })} />
          <Input label="Monto estimado" type="number" placeholder="Ej: 520000" value={draft.estimatedRepairAmount} onChange={(v) => setDraft({ ...draft, estimatedRepairAmount: Number(v) })} />
          <Select label="Estado del siniestro" value={draft.status} options={["open", "under_review", "closed"]} onChange={(v) => setDraft({ ...draft, status: v as Claim["status"] })} />
          <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium text-steel">Dano reportado</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder="Ej: Impacto frontal con dano en paragolpes y optica" value={draft.reportedDamage ?? ""} onChange={(e) => setDraft({ ...draft, reportedDamage: e.target.value })} /></label>
          <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium text-steel">Servicios autorizados</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder="Ej: Paragolpes delantero, Pintura, Mano de obra" value={csv(draft.authorizedServices)} onChange={(e) => setDraft({ ...draft, authorizedServices: list(e.target.value) })} /></label>
          <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium text-steel">Talleres autorizados</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder="Ej: DigitFlow Solutions S.A.S., Taller Norte" value={csv(draft.authorizedWorkshopNames)} onChange={(e) => setDraft({ ...draft, authorizedWorkshopNames: list(e.target.value) })} /></label>
        </div>
        <div className="mt-4 flex gap-2"><button className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>{draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}</div>
      </section>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Siniestro</th><th className="px-5 py-3">Factura</th><th className="px-5 py-3">Poliza</th><th className="px-5 py-3">Asegurado</th><th className="px-5 py-3">Vehiculo</th><th className="px-5 py-3 text-right">Estimado</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">{claims.map((claim) => <tr key={claim.id}><td className="px-5 py-3 font-semibold text-navy">{claim.claimNumber}</td><td className="px-5 py-3 text-steel">{claim.invoiceNumber || "Sin dato"}</td><td className="px-5 py-3 text-steel">{claim.policyNumber}</td><td className="px-5 py-3">{claim.insuredName}</td><td className="px-5 py-3 text-steel">{claim.vehicle}</td><td className="px-5 py-3 text-right">{formatCurrency(claim.estimatedRepairAmount)}</td><td className="px-5 py-3 text-steel">{claim.status}</td><td className="px-5 py-3"><Actions onEdit={() => setDraft(claim)} onDelete={() => remove(claim.id)} /></td></tr>)}</tbody>
        </table>
      </div>
    </LayoutShell>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder={placeholder} type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
}
function Select({ label, value, options, onChange }: { label: string; value: unknown; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button title="Editar registro" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit}><Edit2 className="size-4" /></button><button title="Eliminar registro" className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete}><Trash2 className="size-4" /></button></div>;
}
