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
  { key: "policyNumber", label: "Póliza" },
  { key: "workshopName", label: "Taller" },
  { key: "workshopTaxId", label: "NIT/CUIT taller" },
  { key: "customerName", label: "Cliente" },
  { key: "customerTaxId", label: "CUIT cliente" },
  { key: "insuredName", label: "Asegurado" },
  { key: "vehicle", label: "Vehículo" },
  { key: "licensePlate", label: "Patente / placa" },
  { key: "date", label: "Fecha" },
  { key: "currency", label: "Moneda" },
  { key: "cae", label: "CAE" },
  { key: "uuid", label: "UUID" },
  { key: "fiscalUrl", label: "URL fiscal" },
  { key: "observations", label: "Observaciones" },
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
            [key]: ["quantity", "unitPrice", "discount", "laborHours", "total"].includes(key) ? Number(value) : value,
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
                { id: uid("item"), code: "", description: "", category: "repuesto", quantity: 1, unit: "u", unitPrice: 0, discount: 0, laborHours: 0, total: 0 },
              ],
            })
          }
        >
          <Plus className="size-4" />
          Agregar
        </button>
      </div>
      <div className="mt-3 space-y-3">
        <div className="hidden min-w-0 gap-2 px-3 text-xs font-semibold uppercase tracking-wide text-steel xl:grid xl:grid-cols-[120px_minmax(180px,2fr)_minmax(120px,1fr)_80px_70px_110px_90px_80px_110px_auto]">
          <span>Código</span>
          <span>Descripción</span>
          <span>Categoría</span>
          <span>Cant.</span>
          <span>Unid.</span>
          <span>Unitario</span>
          <span>Desc.</span>
          <span>Horas</span>
          <span>Total</span>
          <span></span>
        </div>
        {invoice.items.map((item, index) => (
          <div key={item.id ?? index} className="grid min-w-0 gap-2 rounded border border-line p-3 xl:grid-cols-[120px_minmax(180px,2fr)_minmax(120px,1fr)_80px_70px_110px_90px_80px_110px_auto]">
            <LabeledInput label="Código" value={item.code ?? ""} onChange={(value) => updateItem(index, "code", value)} placeholder="Código" />
            <LabeledInput label="Descripción" value={item.description} onChange={(value) => updateItem(index, "description", value)} placeholder="Descripción" />
            <LabeledInput label="Categoría" value={item.category} onChange={(value) => updateItem(index, "category", value)} placeholder="Categoría" />
            <LabeledInput label="Cantidad" type="number" value={item.quantity} onChange={(value) => updateItem(index, "quantity", value)} />
            <LabeledInput label="Unidad" value={item.unit ?? ""} onChange={(value) => updateItem(index, "unit", value)} placeholder="Unid." />
            <LabeledInput label="Unitario" type="number" value={item.unitPrice} onChange={(value) => updateItem(index, "unitPrice", value)} />
            <LabeledInput label="Descuento" type="number" value={item.discount ?? 0} onChange={(value) => updateItem(index, "discount", value)} />
            <LabeledInput label="Horas" type="number" value={item.laborHours} onChange={(value) => updateItem(index, "laborHours", value)} />
            <LabeledInput label="Total" type="number" value={item.total} onChange={(value) => updateItem(index, "total", value)} />
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

function LabeledInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="min-w-0 text-xs font-semibold text-steel xl:block">
      <span className="mb-1 block xl:hidden">{label}</span>
      <input
        className="w-full rounded border border-line px-2 py-2 text-sm font-normal text-ink focus-ring"
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}
