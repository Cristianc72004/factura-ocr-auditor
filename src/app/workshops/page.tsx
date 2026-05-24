"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { formatCurrency } from "@/lib/utils";
import type { WorkshopAgreement } from "@/types/policy";

const blank: Partial<WorkshopAgreement> = { insurerName: "Seguros del Norte S.A.", status: "active", allowedCategories: ["repuesto", "material", "mano_obra"] };
const csv = (value?: string[]) => value?.join(", ") ?? "";
const list = (value: string) => value.split(",").map((item) => item.trim()).filter(Boolean);

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopAgreement[]>([]);
  const [draft, setDraft] = useState<Partial<WorkshopAgreement>>(blank);

  useEffect(() => { fetch("/api/workshops").then((r) => r.json()).then((d) => setWorkshops(d.workshops || [])); }, []);

  async function save() {
    const response = await fetch("/api/workshops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    setWorkshops([data.workshop, ...workshops.filter((item) => item.id !== data.workshop.id)]);
    setDraft(blank);
  }

  async function remove(id: string) {
    await fetch(`/api/workshops?id=${id}`, { method: "DELETE" });
    setWorkshops(workshops.filter((item) => item.id !== id));
  }

  return (
    <LayoutShell>
      <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-steel">Convenios de taller</p><h1 className="mt-1 text-3xl font-semibold text-ink">Talleres conveniados</h1></div>
      <section className="mb-6 rounded border border-line bg-white p-4 shadow-subtle">
        <h2 className="mb-3 font-semibold text-ink">{draft.id ? "Editar taller" : "Nuevo taller"}</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(170px,1fr))] gap-3">
          <Input label="Nombre del taller" placeholder="Ej: DigitFlow Solutions S.A.S." value={draft.workshopName} onChange={(v) => setDraft({ ...draft, workshopName: v })} />
          <Input label="CUIT/NIT" placeholder="Ej: 30-900123456-7" value={draft.taxId} onChange={(v) => setDraft({ ...draft, taxId: v })} />
          <Input label="Aseguradora" value={draft.insurerName} onChange={(v) => setDraft({ ...draft, insurerName: v })} />
          <Input label="Tarifa hora MO" type="number" placeholder="Ej: 18000" value={draft.laborHourRate} onChange={(v) => setDraft({ ...draft, laborHourRate: Number(v) })} />
          <Input label="Maximo por factura" type="number" placeholder="Ej: 700000" value={draft.maxInvoiceAmount} onChange={(v) => setDraft({ ...draft, maxInvoiceAmount: Number(v) })} />
          <Select label="Estado del convenio" value={draft.status} options={["active", "suspended"]} onChange={(v) => setDraft({ ...draft, status: v as WorkshopAgreement["status"] })} />
          <label className="text-sm md:col-span-2"><span className="mb-1 block font-medium text-steel">Categorias permitidas</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder="Ej: repuesto, material, mano_obra, servicio" value={csv(draft.allowedCategories)} onChange={(e) => setDraft({ ...draft, allowedCategories: list(e.target.value) })} /></label>
        </div>
        <div className="mt-4 flex gap-2"><button className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>{draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}</div>
      </section>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Taller</th><th className="px-5 py-3">CUIT/NIT</th><th className="px-5 py-3 text-right">Hora MO</th><th className="px-5 py-3 text-right">Max. factura</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">{workshops.map((workshop) => <tr key={workshop.id}><td className="px-5 py-3 font-semibold">{workshop.workshopName}</td><td className="px-5 py-3 text-steel">{workshop.taxId}</td><td className="px-5 py-3 text-right">{formatCurrency(workshop.laborHourRate)}</td><td className="px-5 py-3 text-right">{formatCurrency(workshop.maxInvoiceAmount)}</td><td className="px-5 py-3 text-steel">{workshop.status}</td><td className="px-5 py-3"><Actions onEdit={() => setDraft(workshop)} onDelete={() => remove(workshop.id)} /></td></tr>)}</tbody>
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
