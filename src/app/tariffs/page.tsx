"use client";

import { useEffect, useMemo, useState } from "react";
import { LayoutShell } from "@/components/LayoutShell";
import { TariffTable } from "@/components/TariffTable";
import { normalizeText } from "@/lib/utils";
import type { TariffItem } from "@/types/tariff";

export default function TariffsPage() {
  const [tariffs, setTariffs] = useState<TariffItem[]>([]);
  const [query, setQuery] = useState("");
  const [draft, setDraft] = useState<Partial<TariffItem>>({ category: "servicio", authorized: true });

  useEffect(() => {
    fetch("/api/tariffs")
      .then((response) => response.json())
      .then((data) => setTariffs(data.tariffs || []));
  }, []);

  const filtered = useMemo(() => {
    const q = normalizeText(query);
    return tariffs.filter((item) => normalizeText(`${item.code} ${item.description} ${item.category}`).includes(q));
  }, [query, tariffs]);

  async function save() {
    const response = await fetch("/api/tariffs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = await response.json();
    setTariffs([data.tariff, ...tariffs.filter((item) => item.id !== data.tariff.id)]);
    setDraft({ category: "servicio", authorized: true });
  }

  return (
    <LayoutShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Reglas económicas</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Tarifario</h1>
      </div>
      <div className="mb-6 rounded border border-line bg-white p-4 shadow-subtle">
        <h2 className="mb-3 font-semibold text-ink">Nuevo concepto</h2>
        <div className="grid gap-3 md:grid-cols-6">
          <input className="rounded border border-line px-3 py-2 focus-ring" placeholder="Código" value={draft.code ?? ""} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
          <input className="rounded border border-line px-3 py-2 focus-ring md:col-span-2" placeholder="Descripción" value={draft.description ?? ""} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
          <input className="rounded border border-line px-3 py-2 focus-ring" placeholder="Categoría" value={draft.category ?? ""} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
          <input className="rounded border border-line px-3 py-2 focus-ring" type="number" placeholder="Precio máx." value={draft.maxUnitPrice ?? ""} onChange={(event) => setDraft({ ...draft, maxUnitPrice: Number(event.target.value) })} />
          <button className="focus-ring rounded bg-navy px-4 py-2 text-sm font-semibold text-white" onClick={save}>Guardar</button>
        </div>
      </div>
      <input className="mb-4 w-full rounded border border-line bg-white px-3 py-2 focus-ring" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por código, descripción o categoría" />
      <TariffTable tariffs={filtered} />
    </LayoutShell>
  );
}
