import type { AuditAlert } from "@/types/audit";
import type { ExtractedInvoice, InvoiceRecord } from "@/types/invoice";
import { normalizeText, uid } from "../utils";

export function detectDuplicates(invoice: ExtractedInvoice, previousInvoices: InvoiceRecord[]): AuditAlert[] {
  const alerts: AuditAlert[] = [];
  if (invoice.uuid && previousInvoices.some((item) => item.uuid === invoice.uuid)) {
    alerts.push({
      id: uid("alert"),
      severity: "critical",
      type: "duplicate_uuid",
      message: "El UUID del documento ya existe en el sistema.",
      field: "uuid",
      actualValue: invoice.uuid,
    });
  }
  if (invoice.invoiceNumber && previousInvoices.some((item) => item.invoiceNumber === invoice.invoiceNumber)) {
    alerts.push({
      id: uid("alert"),
      severity: "critical",
      type: "duplicate_invoice",
      message: "El número de factura ya fue auditado previamente.",
      field: "invoiceNumber",
      actualValue: invoice.invoiceNumber,
    });
  }
  const sameCommercialFingerprint = previousInvoices.some(
    (item) =>
      normalizeText(item.workshopName) === normalizeText(invoice.workshopName) &&
      item.claimNumber === invoice.claimNumber &&
      Math.abs(item.total - invoice.total) < 1,
  );
  if (sameCommercialFingerprint) {
    alerts.push({
      id: uid("alert"),
      severity: "critical",
      type: "duplicate_fingerprint",
      message: "Existe una factura previa del mismo taller, siniestro y total.",
      field: "total",
      actualValue: String(invoice.total),
    });
  }

  const seen = new Set<string>();
  for (const item of invoice.items) {
    const key = `${normalizeText(item.description)}-${item.quantity}-${item.unitPrice}-${item.total}`;
    if (seen.has(key)) {
      alerts.push({
        id: uid("alert"),
        severity: "medium",
        type: "duplicate_item",
        message: `El ítem ${item.description} aparece duplicado dentro de la factura.`,
        field: "items",
        actualValue: item.description,
      });
    }
    seen.add(key);
  }
  return alerts;
}
