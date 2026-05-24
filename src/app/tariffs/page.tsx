"use client";

import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2 } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { CATEGORY_LABELS, CATEGORY_OPTIONS, labelFromMap } from "@/lib/labels";
import { formatCurrency, normalizeText } from "@/lib/utils";
import type { TariffItem } from "@/types/tariff";

const blank: Partial<TariffItem> = { category: "servicio", authorized: true, maxLaborHours: 0 };

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Partial<TariffItem>>(blank);

  useEffect(() => {
    fetch("/api/tariffs").then((response) => response.json()).then((data) => setTariffs(data.tariffs || []));
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return tariffs.filter((item) => normalizeText(`${item.code} ${item.description} ${item.category}`).includes(q));
  }, [query, tariffs]);

  async function save() {
    const response = await fetch("/api/tariffs", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
    const data = await response.json();
    setTariffs([data.tariff, ...tariffs.filter((item) => item.id !== data.tariff.id)]);
    setDraft(blank);
  }

  async function remove(id: string) {
    await fetch(`/api/tariffs?id=${id}`, { method: "DELETE" });
    setTariffs(tariffs.filter((item) => item.id !== id));
  }

  return (
    <LayoutShell>
      <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-wide text-steel">Reglas económicas</p><h1 className="mt-1 text-3xl font-semibold text-ink">Tarifario acordado</h1></div>
      <section className="mb-6 rounded border border-line bg-white p-4 shadow-subtle">
        <h2 className="mb-3 font-semibold text-ink">{draft.id ? "Editar concepto" : "Nuevo concepto"}</h2>
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <Input label="Código tarifario" placeholder="Ej: RV-TOY-0456" value={draft.code} onChange={(v) => setDraft({ ...draft, code: v })} />
          <Input label="Descripción del ítem" placeholder="Ej: Paragolpes delantero" value={draft.description} onChange={(v) => setDraft({ ...draft, description: v })} />
          <Select label="Categoría" value={draft.category} options={CATEGORY_OPTIONS} onChange={(v) => setDraft({ ...draft, category: v })} />
          <Input label="Precio máximo" type="number" placeholder="Ej: 120000" value={draft.maxUnitPrice} onChange={(v) => setDraft({ ...draft, maxUnitPrice: Number(v) })} />
          <Input label="Horas máximas" type="number" placeholder="Ej: 2.5" value={draft.maxLaborHours} onChange={(v) => setDraft({ ...draft, maxLaborHours: Number(v) })} />
          <label className="flex items-center rounded border border-line px-3 py-2 text-sm"><span className="flex items-center gap-2"><input type="checkbox" checked={Boolean(draft.authorized)} onChange={(e) => setDraft({ ...draft, authorized: e.target.checked })} /> Autorizado</span></label>
        </div>
        <div className="mt-4 flex gap-2"><button className="rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>{draft.id && <button className="rounded border border-line px-4 py-2 text-sm font-semibold text-steel" onClick={() => setDraft(blank)}>Cancelar</button>}</div>
      </section>
      <input className="mb-4 w-full rounded border border-line bg-white px-3 py-2 focus-ring" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código, descripción o categoría" />
      <div className="w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel"><tr><th className="px-5 py-3">Código</th><th className="px-5 py-3">Descripción</th><th className="px-5 py-3">Categoría</th><th className="px-5 py-3 text-right">Precio máx.</th><th className="px-5 py-3 text-right">Horas</th><th className="px-5 py-3">Autorizado</th><th className="px-5 py-3 text-right">Acciones</th></tr></thead>
          <tbody className="divide-y divide-line">{filtered.map((item) => <tr key={item.id}><td className="px-5 py-3 font-semibold text-navy">{item.code}</td><td className="px-5 py-3">{item.description}</td><td className="px-5 py-3 text-steel">{labelFromMap(CATEGORY_LABELS, item.category)}</td><td className="px-5 py-3 text-right">{formatCurrency(item.maxUnitPrice)}</td><td className="px-5 py-3 text-right">{item.maxLaborHours}</td><td className="px-5 py-3">{item.authorized ? "Sí" : "No"}</td><td className="px-5 py-3"><Actions onEdit={() => setDraft(item)} onDelete={() => remove(item.id)} /></td></tr>)}</tbody>
        </table>
      </div>
    </LayoutShell>
  );
}

function Input({ label, value, onChange, type = "text", placeholder }: { label: string; value: unknown; onChange: (value: string) => void; type?: string; placeholder?: string }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><input className="w-full rounded border border-line px-3 py-2 focus-ring" placeholder={placeholder} type={type} value={String(value ?? "")} onChange={(e) => onChange(e.target.value)} /></label>;
}

function Select({ label, value, options, onChange }: { label: string; value: unknown; options: string[]; onChange: (value: string) => void }) {
  return <label className="text-sm"><span className="mb-1 block font-medium text-steel">{label}</span><select className="w-full rounded border border-line px-3 py-2 focus-ring" value={String(value ?? "")} onChange={(e) => onChange(e.target.value)}>{options.map((option) => <option key={option} value={option}>{labelFromMap(CATEGORY_LABELS, option)}</option>)}</select></label>;
}

function Actions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return <div className="flex justify-end gap-2"><button title="Editar registro" className="grid size-9 place-items-center rounded border border-line text-navy" onClick={onEdit}><Edit2 className="size-4" /></button><button title="Eliminar registro" className="grid size-9 place-items-center rounded border border-line text-rejected" onClick={onDelete}><Trash2 className="size-4" /></button></div>;
}
