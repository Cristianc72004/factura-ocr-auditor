import type { AuditAlert } from "@/types/audit";
import type { ExtractedInvoice } from "@/types/invoice";
import { uid } from "../utils";

const IVA_RATE = 0.21;
const TOLERANCE = 2;

export function calculateTotals(invoice: ExtractedInvoice) {
  const calculatedSubtotal = invoice.items.reduce((total, item) => total + Number(item.total || 0), 0);
  const calculatedTax = Number((calculatedSubtotal * IVA_RATE).toFixed(2));
  const calculatedTotal = Number((calculatedSubtotal + calculatedTax).toFixed(2));
  return { calculatedSubtotal, calculatedTax, calculatedTotal };
}

export function validateTaxes(invoice: ExtractedInvoice): AuditAlert[] {
  const alerts: AuditAlert[] = [];
  const totals = calculateTotals(invoice);
  if (Math.abs(totals.calculatedSubtotal - invoice.subtotal) > TOLERANCE && invoice.subtotal > 0) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "subtotal_mismatch",
      message: "El subtotal calculado no coincide con el subtotal declarado.",
      field: "subtotal",
      expectedValue: String(totals.calculatedSubtotal),
      actualValue: String(invoice.subtotal),
    });
  }
  if (Math.abs(totals.calculatedTax - invoice.tax) > TOLERANCE && invoice.tax > 0) {
    alerts.push({
      id: uid("alert"),
      severity: "medium",
      type: "tax_mismatch",
      message: "El IVA calculado no coincide con el IVA declarado.",
      field: "tax",
      expectedValue: String(totals.calculatedTax),
      actualValue: String(invoice.tax),
    });
  }
  if (Math.abs(totals.calculatedTotal - invoice.total) > TOLERANCE && invoice.total > 0) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "total_mismatch",
      message: "El total calculado no coincide con el total declarado.",
      field: "total",
      expectedValue: String(totals.calculatedTotal),
      actualValue: String(invoice.total),
    });
  }
  return alerts;
}
