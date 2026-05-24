"use client";

import { useEffect, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { CollapsibleMultiSelect } from "@/components/CollapsibleMultiSelect";
import { LayoutShell } from "@/components/LayoutShell";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, WORKSHOP_STATUS_LABELS, labelFromMap } from "@/lib/labels";
import { formatCurrency } from "@/lib/utils";
import type { WorkshopAgreement } from "@/types/policy";

const blank: Partial<WorkshopAgreement> = { insurerName: "Seguros del Norte S.A.", status: "active", allowedCategories: ["repuesto", "material", "mano_obra"] };

export default function WorkshopsPage() {
  const [workshops, setWorkshops] = useState<WorkshopAgreement[]>([]);
  const [draft, setDraft] = useState<Partial<WorkshopAgreement>>(blank);

  useEffect(() => { fetch("/api/workshops").then((r) => r.json()).then((d) => setWorkshops(d.workshops || [])); }, []);

  async function save() {
    const response = await fetch("/api/workshops", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...draft, insurerName: draft.insurerName || "Seguros del Norte S.A." }) });
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
          <Input label="Tarifa por hora de mano de obra" type="number" placeholder="Ej: 18000" value={draft.laborHourRate} onChange={(v) => setDraft({ ...draft, laborHourRate: Number(v) })} />
          <Input label="Máximo por factura" type="number" placeholder="Ej: 700000" value={draft.maxInvoiceAmount} onChange={(v) => setDraft({ ...draft, maxInvoiceAmount: Number(v) })} />
          <Select label="Estado del convenio" value={draft.status} options={["active", "suspended"]} onChange={(v) => setDraft({ ...draft, status: v as WorkshopAgreement["status"] })} />
          <CategoryPicker value={draft.allowedCategories || []} onChange={(allowedCategories) => setDraft({ ...draft, allowedCategories })} />
        </div>
        <div className="mt-4 flex gap-2"><button className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>{draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}</div>
      </section>
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Taller</th><th className="px-5 py-3">CUIT/NIT</th><th className="px-5 py-3">Categorías</th><th className="px-5 py-3 text-right">Hora MO</th><th className="px-5 py-3 text-right">Máx. factura</th><th className="px-5 py-3">Estado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">{workshops.map((workshop) => <tr key={workshop.id}><td className="px-5 py-3 font-semibold">{workshop.workshopName}</td><td className="px-5 py-3 text-steel">{workshop.taxId}</td><td className="px-5 py-3 text-steel">{workshop.allowedCategories.map((item) => labelFromMap(CATEGORY_LABELS, item)).join(", ")}</td><td className="px-5 py-3 text-right">{formatCurrency(workshop.laborHourRate)}</td><td className="px-5 py-3 text-right">{formatCurrency(workshop.maxInvoiceAmount)}</td><td className="px-5 py-3 text-steel">{labelFromMap(WORKSHOP_STATUS_LABELS, workshop.status)}</td><td className="px-5 py-3"><Actions onEdit={() => setDraft(workshop)} onDelete={() => remove(workshop.id)} /></td></tr>)}</tbody>
        </table>
      </div>
    </LayoutShell>
  );
}

function CategoryPicker({ value, onChange }: { value: string[]; onChange: (value: string[]) => void }) {
  function toggle(option: string) {
    onChange(value.includes(option) ? value.filter((item) => item !== option) : [...value, option]);
  }
  const summary = value.length ? value.map((item) => labelFromMap(CATEGORY_LABELS, item)).join(", ") : "Sin categorías seleccionadas";
  return (
    <CollapsibleMultiSelect className="md:col-span-2" title="Categorías permitidas" summary={summary}>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(140px,1fr))] gap-2">
        {CATEGORY_OPTIONS.map((option) => (
          <label key={option} className="flex items-center gap-2 rounded border border-line bg-surface px-3 py-2">
            <input type="checkbox" checked={value.includes(option)} onChange={() => toggle(option)} />
            <span className="font-semibold text-ink">{labelFromMap(CATEGORY_LABELS, option)}</span>
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
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labelFromMap(WORKSHOP_STATUS_LABELS, option)}</option>)}</select></label>;
}
function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button title="Editar registro" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit}><Edit2 className="size-4" /></button><button title="Eliminar registro" className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete}><Trash2 className="size-4" /></button></div>;
}
