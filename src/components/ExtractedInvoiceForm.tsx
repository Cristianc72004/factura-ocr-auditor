"use client";

import { Plus, Trash2 } from "lucide-react";
import type { ExtractedInvoice } from "@/types/invoice";
import { uid } from "@/lib/utils";

type Props = {
  invoice: ExtractedInvoice;
  onChange: (invoice: ExtractedInvoice) => void;
};

const fields: { key: keyof ExtractedInvoice; label: string; type?: string }[] = [
  { key: "invoiceNumber", label: "Factura" },
  { key: "claimNumber", label: "Siniestro" },
  { key: "workshopName", label: "Taller" },
  { key: "insuredName", label: "Asegurado" },
  { key: "vehicle", label: "Vehículo" },
  { key: "licensePlate", label: "Patente / placa" },
  { key: "date", label: "Fecha", type: "date" },
  { key: "uuid", label: "UUID" },
  { key: "subtotal", label: "Subtotal", type: "number" },
  { key: "tax", label: "IVA", type: "number" },
  { key: "total", label: "Total", type: "number" },
];

export function ExtractedInvoiceForm({ invoice, onChange }: Props) {
  function updateField(key: keyof ExtractedInvoice, value: string) {
    onChange({
      ...invoice,
      [key]: ["subtotal", "tax", "total"].includes(String(key)) ? Number(value) : value,
    });
  }

  function updateItem(index: number, key: string, value: string) {
    const items = invoice.items.map((item, itemIndex) =>
      itemIndex === index
        ? {
            ...item,
            [key]: ["quantity", "unitPrice", "laborHours", "total"].includes(key) ? Number(value) : value,
          }
        : item,
    );
    onChange({ ...invoice, items });
  }

  return (
    <div className="rounded border border-line bg-white p-4">
      <h2 className="mb-4 font-semibold text-ink">Datos estructurados</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {fields.map((field) => (
          <label key={String(field.key)} className="text-sm">
            <span className="mb-1 block font-medium text-steel">{field.label}</span>
            <input
              className="w-full rounded border border-line px-3 py-2 text-ink focus-ring"
              type={field.type ?? "text"}
              value={String(invoice[field.key] ?? "")}
              onChange={(event) => updateField(field.key, event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <h3 className="font-semibold text-ink">Ítems cobrados</h3>
        <button
          className="focus-ring inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-sm font-semibold text-navy"
          type="button"
          onClick={() =>
            onChange({
              ...invoice,
              items: [
                ...invoice.items,
                { id: uid("item"), description: "", category: "repuesto", quantity: 1, unitPrice: 0, laborHours: 0, total: 0 },
              ],
            })
          }
        >
          <Plus className="size-4" />
          Agregar
        </button>
      </div>
      <div className="mt-3 space-y-3">
        {invoice.items.map((item, index) => (
          <div key={item.id ?? index} className="grid min-w-0 gap-2 rounded border border-line p-3 lg:grid-cols-[minmax(180px,2fr)_minmax(120px,1fr)_80px_110px_80px_110px_auto]">
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} placeholder="Descripción" />
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" value={item.category} onChange={(event) => updateItem(index, "category", event.target.value)} placeholder="Categoría" />
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" type="number" value={item.quantity} onChange={(event) => updateItem(index, "quantity", event.target.value)} />
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" type="number" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", event.target.value)} />
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" type="number" value={item.laborHours} onChange={(event) => updateItem(index, "laborHours", event.target.value)} />
            <input className="rounded border border-line px-2 py-2 text-sm focus-ring" type="number" value={item.total} onChange={(event) => updateItem(index, "total", event.target.value)} />
            <button
              className="focus-ring grid size-10 place-items-center rounded border border-line text-rejected"
              type="button"
              onClick={() => onChange({ ...invoice, items: invoice.items.filter((_, itemIndex) => itemIndex !== index) })}
              aria-label="Eliminar ítem"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
