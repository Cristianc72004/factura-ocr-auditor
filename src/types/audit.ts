import type { ExtractedInvoice, InvoiceStatus } from "./invoice";

export type AlertSeverity = "low" | "medium" | "high" | "critical";

export type AuditAlert = {
  id: string;
  severity: AlertSeverity;
  type: string;
  message: string;
  field?: string;
  expectedValue?: string;
  actualValue?: string;
};

export type AuditReview = {
  id: string;
  reviewerName: string;
  decision: InvoiceStatus;
  comment: string;
  reviewedAt: string;
};

export type AuditReport = {
  invoice: ExtractedInvoice;
  status: InvoiceStatus;
  riskScore: number;
  alerts: AuditAlert[];
  recommendation: string;
  calculatedSubtotal: number;
  calculatedTax: number;
  calculatedTotal: number;
};
