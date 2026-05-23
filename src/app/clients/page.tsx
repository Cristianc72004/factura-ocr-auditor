"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { formatCurrency } from "@/lib/utils";
import type { InsurancePolicy } from "@/types/policy";

const blank: Partial<InsurancePolicy> = {
  insurerName: "Seguros del Norte S.A.",
  plan: "todo_riesgo",
  status: "active",
  coveredServices: [],
};

const csv = (value?: string[]) => value?.join(", ") ?? "";
const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function ClientsPage() {
  const [policies, setPolicies] = useState<InsurancePolicy[]>([]);
  const [draft, setDraft] = useState<Partial<InsurancePolicy>>(blank);

  async function load() {
    const data = await fetch("/api/policies").then((res) => res.json());
    setPolicies(data.policies || []);
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
        <h2 className="mb-3 font-semibold text-ink">{draft.id ? "Editar poliza" : "Nueva poliza"}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          <Input label="Cliente" value={draft.clientName} onChange={(v) => setDraft({ ...draft, clientName: v })} />
          <Input label="Documento" value={draft.clientDocument} onChange={(v) => setDraft({ ...draft, clientDocument: v })} />
          <Input label="Poliza" value={draft.policyNumber} onChange={(v) => setDraft({ ...draft, policyNumber: v })} />
          <Input label="Aseguradora" value={draft.insurerName} onChange={(v) => setDraft({ ...draft, insurerName: v })} />
          <Input label="Vehiculo" value={draft.vehicle} onChange={(v) => setDraft({ ...draft, vehicle: v })} />
          <Input label="Placa" value={draft.licensePlate} onChange={(v) => setDraft({ ...draft, licensePlate: v })} />
          <Select label="Plan" value={draft.plan} options={["basica", "terceros_completo", "todo_riesgo"]} onChange={(v) => setDraft({ ...draft, plan: v as InsurancePolicy["plan"] })} />
          <Input label="Deducible" type="number" value={draft.deductible} onChange={(v) => setDraft({ ...draft, deductible: Number(v) })} />
          <Input label="Limite" type="number" value={draft.maxRepairAmount} onChange={(v) => setDraft({ ...draft, maxRepairAmount: Number(v) })} />
          <Select label="Estado" value={draft.status} options={["active", "expired", "suspended"]} onChange={(v) => setDraft({ ...draft, status: v as InsurancePolicy["status"] })} />
          <label className="text-sm md:col-span-2">
            <span className="mb-1 block font-medium text-steel">Coberturas</span>
            <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={csv(draft.coveredServices)} onChange={(e) => setDraft({ ...draft, coveredServices: list(e.target.value) })} />
          </label>
        </div>
        <div className="mt-4 flex gap-2">
          <button className="focus-ring rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>
          {draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}
        </div>
      </section>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Cliente</th><th className="px-5 py-3">Poliza</th><th className="px-5 py-3">Vehiculo</th><th className="px-5 py-3">Placa</th><th className="px-5 py-3 text-right">Limite</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">
            {policies.map((policy) => (
              <tr key={policy.id}>
                <td className="px-5 py-3 font-semibold">{policy.clientName}</td><td className="px-5 py-3 text-navy">{policy.policyNumber}</td><td className="px-5 py-3 text-steel">{policy.vehicle}</td><td className="px-5 py-3">{policy.licensePlate}</td><td className="px-5 py-3 text-right">{formatCurrency(policy.maxRepairAmount)}</td><td className="px-5 py-3 text-steel">{policy.status}</td>
                <td className="px-5 py-3"><Actions onEdit={() => setDraft(policy)} onDelete={() => remove(policy.id)} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </LayoutShell>
  );
}

function Header() {
  return <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-steel">Clientes y polizas</p><h1 className="mt-1 text-3xl font-semibold text-ink">Clientes asegurados</h1></div>;
}

function Input({ label, value, onChange, type = "text" }: { label: string; value: unknown; onChange: (value: string) => void; type?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: unknown; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{option}</option>)}</select></label>;
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit} aria-label="Editar"><Edit2 className="size-4" /></button><button className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete} aria-label="Eliminar"><Trash2 className="size-4" /></button></div>;
}
