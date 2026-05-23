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

function guessCategory(description: string, code = "") {
  const value = `${code} ${description}`.toLowerCase();
  if (value.includes("mo-")) return "mano_obra";
  if (value.includes("mat-")) return "material";
  if (value.includes("sv-")) return "servicio";
  if (value.includes("rv-") || value.includes("rep-")) return "repuesto";
  if (value.includes("mano") || value.includes("chapa") || value.includes("hora")) return "mano_obra";
  if (value.includes("pintura") || value.includes("material")) return "material";
  if (value.includes("lavado") || value.includes("alineacion") || value.includes("balanceo")) return "servicio";
  return "repuesto";
}

function cleanExtractedText(value: string) {
  const compact = value.replace(/\s+/g, " ").trim();
  try {
    const repaired = Buffer.from(compact, "latin1").toString("utf8");
    const originalNoise = (compact.match(/\u00c3|\u00c2/g) ?? []).length;
    const repairedNoise = (repaired.match(/\u00c3|\u00c2/g) ?? []).length;
    if (originalNoise > repairedNoise) return repaired;
  } catch {
    // Keep fallback replacements below for runtimes without Buffer.
  }
  return compact
    .replace(/\u00c3\u0093/g, "O")
    .replace(/\u00c3\u00b3/g, "o")
    .replace(/\u00c3\u00a9/g, "e")
    .replace(/\u00c3\u00ad/g, "i")
    .replace(/\u00c3\u00ba/g, "u")
    .replace(/\u00c3\u00b1/g, "n")
    .replace(/\u00c3\u0081/g, "A")
    .replace(/\u00c3\u00a1/g, "a")
    .replace(/\u00c3\u0089/g, "E")
    .replace(/\u00c3\u008d/g, "I")
    .replace(/\u00c3\u009a/g, "U")
    .replace(/\u00c2\u00b0/g, "")
    .replace(/\u00e2\u0080\u0093/g, "-");
}

function normalizeDigitFlowTableText(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/([A-Z]{2,4})-\s*\n\s*([A-Z]{2,4}-\d{1,4})/g, "$1-$2 ")
    .replace(/([A-Z]{2,4}-[A-Z]{2,4})-\s*\n\s*(\d{1,4})/g, "$1-$2 ")
    .replace(/([A-Z]{2,4}-[A-Z]{2,4})-\s+(\d{1,4})/g, "$1-$2 ");
}

function parseDigitFlowRow(row: string) {
  return row.match(
    /^\d{1,2}\s+([A-Z]{2,4}(?:-[A-Z]{2,4})+-?\d{1,4})\s+(.+?)\s+([\d.,]+)\s+([A-Za-z]+)\s+([\d.,]+)\s+([\d.,]+)\s+([\d.,]+)\s*$/i,
  );
}

function isIgnorableTableLine(line: string) {
  return (
    /^(repuestos|insumos|repuestos \/ insumos|mano de obra|servicios adicionales)$/i.test(line) ||
    /^--\s*\d+\s+of\s+\d+\s*--$/i.test(line) ||
    /digitflow solutions/i.test(line) ||
    /\bcuit\b/i.test(line) ||
    /gracias por su confianza/i.test(line)
  );
}

function collectDigitFlowRows(text: string) {
  const normalized = normalizeDigitFlowTableText(text);
  const lines = normalized
    .split(/\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const rows: string[] = [];
  let current = "";
  let inTable = false;

  for (const line of lines) {
    if (/tem.*digo.*descripci/i.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    if (/^(observaciones|subtotal|iva|total ars|identificador|condiciones|gracias)/i.test(line)) break;
    if (isIgnorableTableLine(line)) {
      if (current && parseDigitFlowRow(current)) {
        rows.push(current);
        current = "";
      }
      continue;
    }

    if (/^\d{1,2}\s+/.test(line)) {
      if (current) rows.push(current);
      current = line;
      continue;
    }
    if (current) {
      if (parseDigitFlowRow(current)) {
        rows.push(current);
        current = "";
      } else {
        current = `${current} ${line}`;
      }
    }
  }

  if (current) rows.push(current);
  return rows;
}

function parseDigitFlowItems(text: string): InvoiceItem[] {
  return collectDigitFlowRows(text)
    .map((row) => {
      const match = parseDigitFlowRow(row);
      if (!match) return null;

      const [, code, description, quantityRaw, unit, unitPriceRaw, , totalRaw] = match;
      const quantity = parseMoney(quantityRaw);
      const unitPrice = parseMoney(unitPriceRaw);
      const total = parseMoney(totalRaw);
      if (!description || total <= 0) return null;

      return {
        id: uid("item"),
        description: cleanExtractedText(description),
        category: guessCategory(description, code),
        quantity,
        unitPrice,
        laborHours: unit.toLowerCase() === "h" ? quantity : 0,
        total,
      };
    })
    .filter(Boolean) as InvoiceItem[];
}

function parseFallbackItems(text: string): InvoiceItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const itemLines = lines.filter((line) => {
    const hasMoney = new RegExp(`${numberPattern.source}\\s*$`).test(line);
    return hasMoney && !/subtotal|total|iva|impuesto/i.test(line);
  });

  return itemLines
    .map((line) => {
      const values = line.match(/[\d.,]+/g) ?? [];
      const total = parseMoney(values.at(-1));
      const quantity = values.length >= 3 ? parseMoney(values.at(-3)) : 1;
      const unitPrice = values.length >= 2 ? parseMoney(values.at(-2)) : total;
      const description = line.replace(/[\d.,\s$]+$/g, "").replace(/[-:|]+$/g, "").trim();
      if (!description || total <= 0) return null;
      const category = guessCategory(description);
      return {
        id: uid("item"),
        description,
        category,
        quantity: quantity || 1,
        unitPrice: unitPrice || total,
        laborHours: category === "mano_obra" ? quantity || 1 : 0,
        total,
      };
    })
    .filter(Boolean) as InvoiceItem[];
}

function parseItems(text: string): InvoiceItem[] {
  const digitFlowItems = parseDigitFlowItems(text);
  if (digitFlowItems.length) return digitFlowItems;

  const fallbackItems = parseFallbackItems(text);
  return fallbackItems.length
    ? fallbackItems
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
  const invoiceNumber = pick(text, [
    /\bN\s*([0-9]{4}-[0-9]{8})\b/i,
    /\b([0-9]{4}-[0-9]{8})\b/,
    /factura\s*(?:nro|no|#|numero)?[:\s-]*([0-9]{4}-[0-9]{8})/i,
  ]);
  const claimNumber = pick(text, [
    /(?:nro|no|n)?\s*de?\s*siniestro[:\s-]*([A-Z0-9-]+)/i,
    /\bN\s*Siniestro[:\s-]*([A-Z0-9-]+)/i,
    /siniestro\s*(?:nro|no|#|numero)?[:\s-]*([A-Z0-9-]+)/i,
  ]);
  const workshopName = pick(
    text,
    [/taller[:\s-]*([^\n\r]+)/i, /proveedor[:\s-]*([^\n\r]+)/i],
    /digitflow solutions/i.test(text) ? "DigitFlow Solutions S.A.S." : "",
  );
  const insuredName = pick(text, [/asegurado[:\s-]*([^\n\r]+?)(?:\s+poliza:|\s+poliza\s|$)/i, /cliente[:\s-]*([^\n\r]+)/i]);
  const vehicleLine = pick(text, [/veh.?culo[:\s-]*([^\n\r]+)/i, /auto[:\s-]*([^\n\r]+)/i]);
  const plateFromVehicle = vehicleLine.match(/\b([A-Z]{2,3}\d{3}[A-Z]{0,2})\b/i)?.[1] ?? "";
  const vehicle = vehicleLine.replace(/\s*-\s*[A-Z]{2,3}\d{3}[A-Z]{0,2}\s*$/i, "").trim();
  const licensePlate = pick(text, [/(?:patente|placa|dominio)[:\s-]*([A-Z]{2,3}\s?\d{3}\s?[A-Z]{0,2})/i], plateFromVehicle);
  const uuid = pick(text, [/uuid[:\s-]*([a-z0-9-]{12,})/i, /\b([a-z0-9]{8}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{12})\b/i]);
  const date = pick(text, [/emision[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})/i, /fecha\s*(?:de\s*emisi.n)?[:\s-]*(\d{2}[/-]\d{2}[/-]\d{4})/i, /\b(\d{4}-\d{2}-\d{2})\b/]);
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
