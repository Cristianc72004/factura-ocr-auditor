"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { DetailModal } from "@/components/DetailModal";
import { formatCurrency } from "@/lib/utils";
import { uid } from "@/lib/utils";
import type { ExtractedInvoice } from "@/types/invoice";

type Props = {
  invoice: ExtractedInvoice;
  onChange: (invoice: ExtractedInvoice) => void;
};

const fields: { key: keyof ExtractedInvoice; label: string; type?: string }[] = [
  { key: "invoiceNumber", label: "Factura" },
  { key: "claimNumber", label: "Siniestro" },
  { key: "policyNumber", label: "Poliza" },
  { key: "workshopName", label: "Taller" },
  { key: "workshopTaxId", label: "NIT/CUIT taller" },
  { key: "customerName", label: "Cliente" },
  { key: "customerTaxId", label: "CUIT cliente" },
  { key: "insuredName", label: "Asegurado" },
  { key: "vehicle", label: "Vehiculo" },
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

const mainFields = fields.filter((field) => ["invoiceNumber", "claimNumber", "policyNumber", "workshopName", "insuredName", "vehicle", "licensePlate", "date"].includes(String(field.key)));
const fiscalFields = fields.filter((field) => ["workshopTaxId", "customerName", "customerTaxId", "currency", "cae", "uuid", "fiscalUrl", "observations"].includes(String(field.key)));
const totalFields = fields.filter((field) => ["subtotal", "tax", "total"].includes(String(field.key)));

export function ExtractedInvoiceForm({ invoice, onChange }: Props) {
  const [itemsOpen, setItemsOpen] = useState(false);

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
    <div className="space-y-3">
      <CollapsibleSection title="Datos principales" summary={`${invoice.invoiceNumber || "Sin factura"} - ${invoice.claimNumber || "Sin siniestro"}`} defaultOpen>
        <FieldGrid fields={mainFields} invoice={invoice} updateField={updateField} />
      </CollapsibleSection>

      <CollapsibleSection title="Datos fiscales" summary={invoice.uuid || invoice.cae || "Opcional"}>
        <FieldGrid fields={fiscalFields} invoice={invoice} updateField={updateField} />
      </CollapsibleSection>

      <CollapsibleSection title="Totales" summary={`Total ${invoice.total || 0}`} defaultOpen>
        <FieldGrid fields={totalFields} invoice={invoice} updateField={updateField} />
      </CollapsibleSection>

      <CollapsibleSection title="Items cobrados" summary={`${invoice.items.length} item(s)`} defaultOpen>
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-3">
            <MiniStat label="Items" value={String(invoice.items.length)} />
            <MiniStat label="Total items" value={formatCurrency(invoice.items.reduce((sum, item) => sum + Number(item.total || 0), 0))} />
            <MiniStat label="Horas" value={String(invoice.items.reduce((sum, item) => sum + Number(item.laborHours || 0), 0))} />
          </div>
          <div className="max-h-64 overflow-y-auto rounded border border-line">
            {invoice.items.length ? invoice.items.map((item, index) => (
              <div key={item.id ?? index} className="flex min-w-0 items-center justify-between gap-3 border-b border-line px-3 py-2 last:border-b-0">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">{item.description || "Item sin descripcion"}</p>
                  <p className="truncate text-xs text-steel">{item.code || "Sin codigo"} - {item.category} - {item.quantity} {item.unit || "u"}</p>
                </div>
                <p className="shrink-0 text-sm font-semibold text-ink">{formatCurrency(item.total)}</p>
              </div>
            )) : <p className="p-3 text-sm text-steel">No hay items cargados.</p>}
          </div>
          <button className="focus-ring w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white" type="button" onClick={() => setItemsOpen(true)}>
            Editar items en ventana
          </button>
        </div>

        <DetailModal title="Editar items cobrados" open={itemsOpen} onClose={() => setItemsOpen(false)}>
          <div className="space-y-4">
            <div className="flex justify-end">
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
            <div className="grid gap-3">
              {invoice.items.map((item, index) => (
                <div key={item.id ?? index} className="rounded border border-line p-3">
                  <div className="grid min-w-0 gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <LabeledInput label="Codigo" value={item.code ?? ""} onChange={(value) => updateItem(index, "code", value)} placeholder="Codigo" />
                    <LabeledInput label="Descripcion" value={item.description} onChange={(value) => updateItem(index, "description", value)} placeholder="Descripcion" />
                    <LabeledInput label="Categoria" value={item.category} onChange={(value) => updateItem(index, "category", value)} placeholder="Categoria" />
                    <LabeledInput label="Cantidad" type="number" value={item.quantity} onChange={(value) => updateItem(index, "quantity", value)} />
                    <LabeledInput label="Unidad" value={item.unit ?? ""} onChange={(value) => updateItem(index, "unit", value)} placeholder="Unid." />
                    <LabeledInput label="Unitario" type="number" value={item.unitPrice} onChange={(value) => updateItem(index, "unitPrice", value)} />
                    <LabeledInput label="Descuento" type="number" value={item.discount ?? 0} onChange={(value) => updateItem(index, "discount", value)} />
                    <LabeledInput label="Horas" type="number" value={item.laborHours} onChange={(value) => updateItem(index, "laborHours", value)} />
                    <LabeledInput label="Total" type="number" value={item.total} onChange={(value) => updateItem(index, "total", value)} />
                    <button
                      className="focus-ring grid h-10 place-items-center rounded border border-line text-rejected"
                      type="button"
                      onClick={() => onChange({ ...invoice, items: invoice.items.filter((_, itemIndex) => itemIndex !== index) })}
                      aria-label="Eliminar item"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DetailModal>
      </CollapsibleSection>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded bg-surface p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold text-ink">{value}</p>
    </div>
  );
}

function FieldGrid({
  fields,
  invoice,
  updateField,
}: {
  fields: typeof mainFields;
  invoice: ExtractedInvoice;
  updateField: (key: keyof ExtractedInvoice, value: string) => void;
}) {
  return (
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
    <label className="min-w-0 text-xs font-semibold text-steel">
      <span className="mb-1 block">{label}</span>
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
