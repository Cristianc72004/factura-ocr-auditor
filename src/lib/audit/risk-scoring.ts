import type { AuditAlert } from "@/types/audit";
import type { InvoiceStatus } from "@/types/invoice";

const severityPoints = {
  critical: 40,
  high: 25,
  medium: 15,
  low: 5,
};

export function calculateRiskScore(alerts: AuditAlert[]) {
  return Math.min(100, alerts.reduce((total, alert) => total + severityPoints[alert.severity], 0));
}

export function classifyInvoice(score: number, alerts: AuditAlert[]): InvoiceStatus {
  if (alerts.some((alert) => alert.severity === "critical")) return "rejected";
  if (score <= 30) return "approved";
  if (score <= 70) return "observed";
  return "rejected";
}
