import type { ExtractedInvoice, InvoiceItem } from "@/types/invoice";
import { uid } from "../utils";

const numberPattern = /[\d.,]+/;

function pick(text: string, patterns: RegExp[], fallback = "") {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) return match[1].trim();
  }
  return fallback;
}

function parseMoney(value?: string | null) {
  if (!value) return 0;
  const clean = value.replace(/[^\d.,-]/g, "");
  if (!clean) return 0;
  const lastComma = clean.lastIndexOf(",");
  const lastDot = clean.lastIndexOf(".");
  const decimalIndex = Math.max(lastComma, lastDot);
  const normalized =
    decimalIndex >= 0
      ? clean.slice(0, decimalIndex).replace(/[.,]/g, "") + "." + clean.slice(decimalIndex + 1).replace(/[.,]/g, "")
      : clean.replace(/[.,]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function guessCategory(description: string) {
  const value = description.toLowerCase();
  if (value.includes("mano") || value.includes("chapa") || value.includes("hora")) return "mano_obra";
  if (value.includes("pintura") || value.includes("material")) return "material";
  if (value.includes("lavado") || value.includes("alineacion") || value.includes("balanceo")) return "servicio";
  return "repuesto";
}

function parseItems(text: string): InvoiceItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const itemLines = lines.filter((line) => {
    const hasMoney = new RegExp(`${numberPattern.source}\\s*$`).test(line);
    return hasMoney && !/subtotal|total|iva|impuesto/i.test(line);
  });

  const items = itemLines
    .map((line) => {
      const values = line.match(/[\d.,]+/g) ?? [];
      const total = parseMoney(values.at(-1));
      const quantity = values.length >= 3 ? parseMoney(values.at(-3)) : 1;
      const unitPrice = values.length >= 2 ? parseMoney(values.at(-2)) : total;
      const description = line.replace(/[\d.,\s$]+$/g, "").replace(/[-:|]+$/g, "").trim();
      if (!description || total <= 0) return null;
      return {
        id: uid("item"),
        description,
        category: guessCategory(description),
        quantity: quantity || 1,
        unitPrice: unitPrice || total,
        laborHours: guessCategory(description) === "mano_obra" ? quantity || 1 : 0,
        total,
      };
    })
    .filter(Boolean) as InvoiceItem[];

  return items.length
    ? items
    : [
        {
          id: uid("item"),
          description: "Paragolpes delantero",
          category: "repuesto",
          quantity: 1,
          unitPrice: 0,
          laborHours: 0,
          total: 0,
        },
      ];
}

export function parseInvoiceText(rawText: string): ExtractedInvoice {
  const text = rawText.replace(/\u00a0/g, " ");
  const invoiceNumber = pick(text, [/\bN\s*([0-9]{4}-[0-9]{8})\b/i, /\b([0-9]{4}-[0-9]{8})\b/, /factura\s*(?:nro|no|#|numero)?[:\s-]*([0-9]{4}-[0-9]{8})/i]);
  const claimNumber = pick(text, [/(?:n°|nº|nro|no|n)?\s*de?\s*siniestro[:\s-]*([A-Z0-9-]+)/i, /\bN\s*Siniestro[:\s-]*([A-Z0-9-]+)/i, /siniestro\s*(?:nro|no|#|numero)?[:\s-]*([A-Z0-9-]+)/i]);
  const workshopName = pick(text, [/taller[:\s-]*([^\n\r]+)/i, /proveedor[:\s-]*([^\n\r]+)/i], /digitflow solutions/i.test(text) ? "DigitFlow Solutions S.A.S." : "");
  const insuredName = pick(text, [/asegurado[:\s-]*([^\n\r]+)/i, /cliente[:\s-]*([^\n\r]+)/i]);
  const vehicleLine = pick(text, [/veh[ií]culo[:\s-]*([^\n\r]+)/i, /auto[:\s-]*([^\n\r]+)/i]);
  const plateFromVehicle = vehicleLine.match(/\b([A-Z]{2,3}\d{3}[A-Z]{0,2})\b/i)?.[1] ?? "";
  const vehicle = vehicleLine.replace(/\s*-\s*[A-Z]{2,3}\d{3}[A-Z]{0,2}\s*$/i, "").trim();
  const licensePlate = pick(text, [/(?:patente|placa|dominio)[:\s-]*([A-Z]{2,3}\s?\d{3}\s?[A-Z]{0,2})/i], plateFromVehicle);
  const uuid = pick(text, [/uuid[:\s-]*([a-f0-9-]{12,})/i, /\b([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})\b/i]);
  const date = pick(text, [/fecha\s*(?:de\s*emisi[oó]n)?[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})/i, /\b(\d{4}-\d{2}-\d{2})\b/]);
  const subtotal = parseMoney(pick(text, [/subtotal[:\s$]*([\d.,]+)/i]));
  const tax = parseMoney(pick(text, [/(?:iva|impuesto)(?:\s*\([^)]*\))?[:\s$]*([\d.,]+)/i]));
  const total = parseMoney(pick(text, [/total\s*ars[:\s$]*([\d.,]+)/i, /total[:\s$]*([\d.,]+)/i]));
  const items = parseItems(text);

  return {
    invoiceNumber,
    claimNumber,
    workshopName,
    insuredName,
    vehicle,
    licensePlate: licensePlate.replace(/\s+/g, ""),
    date,
    uuid,
    subtotal,
    tax,
    total,
    items,
  };
}
