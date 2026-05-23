import type { AuditReport } from "@/types/audit";
import type { Claim } from "@/types/claim";
import type { ExtractedInvoice, InvoiceRecord } from "@/types/invoice";
import type { TariffItem } from "@/types/tariff";
import { validateClaim } from "./claim-validator";
import { detectDuplicates } from "./duplicate-detector";
import { calculateRiskScore, classifyInvoice } from "./risk-scoring";
import { validateTariffs } from "./tariff-validator";
import { calculateTotals, validateTaxes } from "./tax-validator";

export function auditInvoice(
  invoice: ExtractedInvoice,
  context: {
    tariffs: TariffItem[];
    claims: Claim[];
    previousInvoices: InvoiceRecord[];
  },
): AuditReport {
  const alerts = [
    ...detectDuplicates(invoice, context.previousInvoices),
    ...validateTaxes(invoice),
    ...validateTariffs(invoice.items, context.tariffs),
    ...validateClaim(invoice, context.claims),
  ];
  const riskScore = calculateRiskScore(alerts);
  const status = classifyInvoice(riskScore, alerts);
  const totals = calculateTotals(invoice);
  const recommendation =
    status === "approved"
      ? "Aprobar el pago automáticamente. No se detectaron alertas relevantes."
      : status === "observed"
        ? "Enviar a revisión humana antes de aprobar el pago."
        : "Rechazar preventivamente y solicitar aclaración/documentación al taller.";

  return {
    invoice,
    status,
    riskScore,
    alerts,
    recommendation,
    ...totals,
  };
}
