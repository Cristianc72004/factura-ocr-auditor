"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { CollapsibleMultiSelect } from "@/components/CollapsibleMultiSelect";
import { LayoutShell } from "@/components/LayoutShell";
import { PLAN_LABELS, POLICY_STATUS_LABELS, labelFromMap } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import type { InsurancePolicy } from "@/types/policy";
import type { TariffItem } from "@/types/tariff";

const blank: Partial<InsurancePolicy> = {
  insurerName: "Seguros del Norte S.A.",
  plan: "todo_riesgo",
  status: "active",
  coveredServices: [],
};

export default function ClientsPage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [draft, setDraft] = useState<Partial<InsurancePolicy>>(blank);

  async function load() {
    const [policyData, tariffData] = await Promise.all([
      fetch("/api/policies").then((res) => res.json()),
      fetch("/api/tariffs").then((res) => res.json()),
    ]);
    setPolicies(policyData.policies || []);
    setTariffs(tariffData.tariffs || []);
  }

  useEffect(() => {
    load();
  }, []);

  async function save() {
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    setPolicies([data.policy, ...policies.filter((item) => item.id !== data.policy.id)]);
    setDraft(blank);
  }

  async function remove(id: string) {
    await fetch(`/api/policies?id=${id}`, { method: "DELETE" });
    setPolicies(policies.filter((item) => item.id !== id));
  }

  return (
    <LayoutShell>
      <Header />
      <section className="mb-6 rounded border border-line bg-white p-4 shadow-subtle">
        <h2 className="mb-3 font-semibold text-ink">{draft.id ? "Editar póliza" : "Nueva póliza"}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          <Input label="Cliente asegurado" placeholder="Ej: Juan Pérez" value={draft.clientName} onChange={(v) => setDraft({ ...draft, clientName: v })} />
          <Input label="Documento" placeholder="Ej: DNI 28.345.678" value={draft.clientDocument} onChange={(v) => setDraft({ ...draft, clientDocument: v })} />
          <Input label="Número de póliza" placeholder="Ej: POL-AR-2024-0001" value={draft.policyNumber} onChange={(v) => setDraft({ ...draft, policyNumber: v })} />
          <Input label="Aseguradora" placeholder="Ej: Seguros del Norte S.A." value={draft.insurerName} onChange={(v) => setDraft({ ...draft, insurerName: v })} />
          <Input label="Vehículo asegurado" placeholder="Ej: Toyota Corolla XEI 2.0 2020" value={draft.vehicle} onChange={(v) => setDraft({ ...draft, vehicle: v })} />
          <Input label="Placa / dominio" placeholder="Ej: AB123CD" value={draft.licensePlate} onChange={(v) => setDraft({ ...draft, licensePlate: v })} />
          <Select label="Plan contratado" value={draft.plan} options={["basica", "terceros_completo", "todo_riesgo"]} map={PLAN_LABELS} onChange={(v) => setDraft({ ...draft, plan: v as InsurancePolicy["plan"] })} />
          <Input label="Deducible" type="number" placeholder="Ej: 35000" value={draft.deductible} onChange={(v) => setDraft({ ...draft, deductible: Number(v) })} />
          <Input label="Límite de reparación" type="number" placeholder="Ej: 650000" value={draft.maxRepairAmount} onChange={(v) => setDraft({ ...draft, maxRepairAmount: Number(v) })} />
          <Select label="Estado de póliza" value={draft.status} options={["active", "expired", "suspended"]} map={POLICY_STATUS_LABELS} onChange={(v) => setDraft({ ...draft, status: v as InsurancePolicy["status"] })} />
          <TariffMultiPicker label="Coberturas" value={draft.coveredServices || []} tariffs={tariffs} onChange={(coveredServices) => setDraft({ ...draft, coveredServices })} />
        </div>
        <div className="mt-4 flex gap-2">
          <button className="focus-ring rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>
          {draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}
        </div>
      </section>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Documento</th><th className="px-5 py-3">Póliza</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Vehículo</th><th className="px-5 py-3">Placa</th><th className="px-5 py-3 text-right">Deducible</th><th className="px-5 py-3 text-right">Límite</th><th className="px-5 py-3">Coberturas</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="px-5 py-3 font-semibold">{policy.clientName}</td><td className="px-5 py-3 text-steel">{policy.clientDocument}</td><td className="px-5 py-3 text-navy">{policy.policyNumber}</td><td className="px-5 py-3 text-steel">{labelFromMap(PLAN_LABELS, policy.plan)}</td><td className="px-5 py-3 text-steel">{policy.vehicle}</td><td className="px-5 py-3">{policy.licensePlate}</td><td className="px-5 py-3 text-right">{formatCurrency(policy.deductible)}</td><td className="px-5 py-3 text-right">{formatCurrency(policy.maxRepairAmount)}</td><td className="max-w-xs px-5 py-3 text-steel">{policy.coveredServices.join(", ") || "Sin dato"}</td><td className="px-5 py-3 text-steel">{labelFromMap(POLICY_STATUS_LABELS, policy.status)}</td>
                <td className="px-5 py-3"><Actions onEdit={() => setDraft(policy)} onDelete={() => remove(policy.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LayoutShell>
  );
}

function TariffMultiPicker({ label, value, tariffs, onChange }: { label: string; value: string[]; tariffs: TariffItem[]; onChange: (value: string[]) => void }) {
  function toggle(description: string) {
    onChange(value.includes(description) ? value.filter((item) => item !== description) : [...value, description]);
  }
  const summary = value.length ? `${value.length} seleccionadas: ${value.slice(0, 2).join(", ")}${value.length > 2 ? "..." : ""}` : "Sin coberturas seleccionadas";
  return (
    <CollapsibleMultiSelect className="md:col-span-3" title={label} summary={summary}>
      <div className="grid max-h-56 grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-2 overflow-y-auto">
        {tariffs.map((item) => (
          <label key={item.id} className="flex gap-2 rounded border border-line bg-white p-3">
            <input className="mt-1" type="checkbox" checked={value.includes(item.description)} onChange={() => toggle(item.description)} />
            <span><span className="block font-semibold text-ink">{item.code} · {item.description}</span><span className="text-xs text-steel">{formatCurrency(item.maxUnitPrice)} · {item.maxLaborHours} h</span></span>
          </label>
        ))}
      </div>
    </CollapsibleMultiSelect>
  );
}

function Header() {
  return <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-steel">Clientes y pólizas</p><h1 className="mt-1 text-3xl font-semibold text-ink">Clientes asegurados</h1></div>;
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder={placeholder} type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, map, onChange }: { label: string; value: unknown; options: string[]; map: Record<string, string>; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labelFromMap(map, option)}</option>)}</select></label>;
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button title="Editar registro" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit} aria-label="Editar"><Edit2 className="size-4" /></button><button title="Eliminar registro" className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete} aria-label="Eliminar"><Trash2 className="size-4" /></button></div>;
}
