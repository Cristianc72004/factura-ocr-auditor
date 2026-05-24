"use client";

import { useEffect, useState } from "react";
import { Edit2, Eye, Trash2 } from "lucide-react";
import { CollapsibleMultiSelect } from "@/components/CollapsibleMultiSelect";
import { DetailModal } from "@/components/DetailModal";
import { LayoutShell } from "@/components/LayoutShell";
import { CLAIM_STATUS_LABELS, labelFromMap } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import type { Claim } from "@/types/claim";
import type { WorkshopAgreement } from "@/types/policy";
import type { TariffItem } from "@/types/tariff";

const blank: Partial<Claim> = {
  insurerName: "Seguros del Norte S.A.",
  status: "open",
  authorizedServices: [],
  authorizedWorkshopNames: [],
  accidentDate: new Date().toISOString().slice(0, 10),
};

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [workshops, setWorkshops] = useState<WorkshopAgreement[]>([]);
  const [draft, setDraft] = useState<Partial<Claim>>(blank);
  const [selected, setSelected] = useState<Claim | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/claims").then((r) => r.json()),
      fetch("/api/tariffs").then((r) => r.json()),
      fetch("/api/workshops").then((r) => r.json()),
    ]).then(([claimData, tariffData, workshopData]) => {
      setClaims(claimData.claims || []);
      setTariffs(tariffData.tariffs || []);
      setWorkshops(workshopData.workshops || []);
    });
  }, []);

  async function save() {
    const response = await fetch("/api/claims", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
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
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Reporte del cliente</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Siniestros reportados</h1>
      </div>

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
          <Input label="Fecha del accidente" type="date" value={draft.accidentDate} onChange={(v) => setDraft({ ...draft, accidentDate: v })} />
          <Input label="Monto estimado" type="number" placeholder="Ej: 520000" value={draft.estimatedRepairAmount} onChange={(v) => setDraft({ ...draft, estimatedRepairAmount: Number(v) })} />
          <Select label="Estado del siniestro" value={draft.status} options={["open", "under_review", "closed"]} onChange={(v) => setDraft({ ...draft, status: v as Claim["status"] })} />
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-steel">Dano reportado</span>
            <textarea className="min-h-20 w-full rounded border border-line px-3 py-2 focus-ring" placeholder="Ej: Impacto frontal con dano en paragolpes y optica" value={draft.reportedDamage ?? ""} onChange={(e) => setDraft({ ...draft, reportedDamage: e.target.value })} />
          </label>
          <TariffPicker value={draft.authorizedServices || []} tariffs={tariffs} onChange={(authorizedServices) => setDraft({ ...draft, authorizedServices })} />
          <WorkshopPicker value={draft.authorizedWorkshopNames || []} workshops={workshops} onChange={(authorizedWorkshopNames) => setDraft({ ...draft, authorizedWorkshopNames })} />
        </div>
        <div className="mt-4 flex gap-2">
          <button className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>
          {draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}
        </div>
      </section>

      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel">
            <tr>
              <th className="px-5 py-3">Siniestro</th>
              <th className="px-5 py-3">Factura</th>
              <th className="px-5 py-3">Poliza</th>
              <th className="px-5 py-3">Asegurado</th>
              <th className="px-5 py-3">Vehiculo</th>
              <th className="px-5 py-3 text-right">Estimado</th>
              <th className="px-5 py-3">Estado</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {claims.map((claim) => (
              <tr key={claim.id}>
                <td className="px-5 py-3 font-semibold text-navy">{claim.claimNumber}</td>
                <td className="px-5 py-3 text-steel">{claim.invoiceNumber || "Sin dato"}</td>
                <td className="px-5 py-3 text-steel">{claim.policyNumber}</td>
                <td className="px-5 py-3">{claim.insuredName}</td>
                <td className="px-5 py-3 text-steel">{claim.vehicle}</td>
                <td className="px-5 py-3 text-right">{formatCurrency(claim.estimatedRepairAmount)}</td>
                <td className="px-5 py-3 text-steel">{labelFromMap(CLAIM_STATUS_LABELS, claim.status)}</td>
                <td className="px-5 py-3"><Actions onView={() => setSelected(claim)} onEdit={() => setDraft(claim)} onDelete={() => remove(claim.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <DetailModal title={selected ? `Siniestro ${selected.claimNumber}` : "Siniestro"} open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 md:grid-cols-3">
              <Info label="Factura informada" value={selected.invoiceNumber || "Sin dato"} />
              <Info label="Poliza" value={selected.policyNumber || "Sin dato"} />
              <Info label="Estado" value={labelFromMap(CLAIM_STATUS_LABELS, selected.status)} />
              <Info label="Asegurado" value={selected.insuredName || "Sin dato"} />
              <Info label="Vehiculo" value={selected.vehicle || "Sin dato"} />
              <Info label="Placa" value={selected.licensePlate || "Sin dato"} />
              <Info label="Aseguradora" value={selected.insurerName || "Sin dato"} />
              <Info label="Fecha accidente" value={selected.accidentDate || "Sin dato"} />
              <Info label="Monto estimado" value={formatCurrency(selected.estimatedRepairAmount)} />
            </div>
            <DetailBlock title="Dano reportado" value={selected.reportedDamage || "Sin dato"} />
            <DetailBlock title="Servicios autorizados" value={selected.authorizedServices.join(", ") || "Sin dato"} />
            <DetailBlock title="Talleres autorizados" value={selected.authorizedWorkshopNames.join(", ") || "Sin dato"} />
          </div>
        )}
      </DetailModal>
    </LayoutShell>
  );
}

function TariffPicker({ value, tariffs, onChange }: { value: string[]; tariffs: TariffItem[]; onChange: (value: string[]) => void }) {
  function toggle(description: string) {
    onChange(value.includes(description) ? value.filter((item) => item !== description) : [...value, description]);
  }
  const summary = value.length ? `${value.length} servicios: ${value.slice(0, 2).join(", ")}${value.length > 2 ? "..." : ""}` : "Sin servicios seleccionados";
  return (
    <CollapsibleMultiSelect className="md:col-span-3" title="Servicios autorizados" summary={summary}>
      <div className="grid max-h-64 grid-cols-[repeat(auto-fit,minmax(230px,1fr))] gap-2 overflow-y-auto">
        {tariffs.map((item) => (
          <label key={item.id} className="flex gap-2 rounded border border-line bg-white p-3">
            <input className="mt-1" type="checkbox" checked={value.includes(item.description)} onChange={() => toggle(item.description)} />
            <span><span className="block text-sm font-semibold text-ink">{item.code} - {item.description}</span><span className="text-xs text-steel">{formatCurrency(item.maxUnitPrice)} - {item.maxLaborHours} h</span></span>
          </label>
        ))}
      </div>
    </CollapsibleMultiSelect>
  );
}

function WorkshopPicker({ value, workshops, onChange }: { value: string[]; workshops: WorkshopAgreement[]; onChange: (value: string[]) => void }) {
  function toggle(name: string) {
    onChange(value.includes(name) ? value.filter((item) => item !== name) : [...value, name]);
  }
  const summary = value.length ? `${value.length} talleres: ${value.slice(0, 2).join(", ")}${value.length > 2 ? "..." : ""}` : "Sin talleres seleccionados";
  return (
    <CollapsibleMultiSelect className="md:col-span-3" title="Talleres autorizados" summary={summary}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-2">
        {workshops.map((item) => (
          <label key={item.id} className="flex gap-2 rounded border border-line bg-surface p-3">
            <input className="mt-1" type="checkbox" checked={value.includes(item.workshopName)} onChange={() => toggle(item.workshopName)} />
            <span><span className="block font-semibold text-ink">{item.workshopName}</span><span className="text-xs text-steel">{item.taxId}</span></span>
          </label>
        ))}
      </div>
    </CollapsibleMultiSelect>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder={placeholder} type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: unknown; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labelFromMap(CLAIM_STATUS_LABELS, option)}</option>)}</select></label>;
}

function Actions({ onView, onEdit, onDelete }: { onView: () => void; onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button title="Ver detalle" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onView}><Eye className="size-4" /></button><button title="Editar registro" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit}><Edit2 className="size-4" /></button><button title="Eliminar registro" className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete}><Trash2 className="size-4" /></button></div>;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function DetailBlock({ title, value }: { title: string; value: string }) {
  return (
    <section className="rounded border border-line p-4">
      <h3 className="mb-2 font-semibold text-ink">{title}</h3>
      <p className="text-sm leading-6 text-steel">{value}</p>
    </section>
  );
}
