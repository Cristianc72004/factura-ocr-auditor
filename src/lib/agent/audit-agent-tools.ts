import { listClaims, listInvoices, listPolicies, listTariffs, listWorkshops } from "@/lib/db";
import { normalizeText } from "@/lib/utils";
import type { AuditAlert } from "@/types/audit";

export async function getAgentDataset() {
  const [invoices, claims, policies, workshops, tariffs] = await Promise.all([
    listInvoices(),
    listClaims(),
    listPolicies(),
    listWorkshops(),
    listTariffs(),
  ]);
  return { invoices, claims, policies, workshops, tariffs };
}

export function getInvoiceByNumber(invoices: Awaited<ReturnType<typeof listInvoices>>, invoiceNumber?: string) {
  if (!invoiceNumber) return null;
  return invoices.find((invoice) => invoice.invoiceNumber === invoiceNumber) ?? null;
}

export function getInvoiceById(invoices: Awaited<ReturnType<typeof listInvoices>>, id?: string) {
  if (!id) return null;
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export function getClaimByNumber(claims: Awaited<ReturnType<typeof listClaims>>, claimNumber?: string) {
  if (!claimNumber) return null;
  return claims.find((claim) => claim.claimNumber === claimNumber) ?? null;
}

export function getClaimByInvoiceNumber(claims: Awaited<ReturnType<typeof listClaims>>, invoiceNumber?: string) {
  if (!invoiceNumber) return null;
  return claims.find((claim) => claim.invoiceNumber === invoiceNumber) ?? null;
}

export function getCriticalAlerts(invoices: Awaited<ReturnType<typeof listInvoices>>) {
  return invoices.flatMap((invoice) => invoice.alerts.map((alert) => ({ ...alert, invoice }))).filter((item) => item.severity === "critical");
}

export function getObservedInvoices(invoices: Awaited<ReturnType<typeof listInvoices>>) {
  return invoices.filter((invoice) => invoice.status === "observed");
}

export function getRejectedInvoices(invoices: Awaited<ReturnType<typeof listInvoices>>) {
  return invoices.filter((invoice) => invoice.status === "rejected");
}

export function getDuplicateCandidates(invoices: Awaited<ReturnType<typeof listInvoices>>) {
  const alerts = invoices.flatMap((invoice) => invoice.alerts.map((alert) => ({ invoice, alert })));
  return alerts.filter(({ alert }) => alert.type.includes("duplicate"));
}

export function getDashboardMetrics(
  invoices: Awaited<ReturnType<typeof listInvoices>>,
  dataset?: {
    policies: Awaited<ReturnType<typeof listPolicies>>;
    claims: Awaited<ReturnType<typeof listClaims>>;
    workshops: Awaited<ReturnType<typeof listWorkshops>>;
    tariffs: Awaited<ReturnType<typeof listTariffs>>;
  },
) {
  return {
    total: invoices.length,
    approved: invoices.filter((item) => item.status === "approved").length,
    observed: invoices.filter((item) => item.status === "observed").length,
    rejected: invoices.filter((item) => item.status === "rejected").length,
    criticalAlerts: getCriticalAlerts(invoices).length,
    policies: dataset?.policies.length ?? 0,
    claims: dataset?.claims.length ?? 0,
    workshops: dataset?.workshops.length ?? 0,
    tariffs: dataset?.tariffs.length ?? 0,
  };
}

export function getWorkshopSummary(invoices: Awaited<ReturnType<typeof listInvoices>>) {
  const map = new Map<string, { workshopName: string; total: number; rejected: number; observed: number; alerts: number }>();
  for (const invoice of invoices) {
    const key = normalizeText(invoice.workshopName || "sin taller");
    const current = map.get(key) ?? { workshopName: invoice.workshopName || "Sin taller", total: 0, rejected: 0, observed: 0, alerts: 0 };
    current.total += 1;
    current.rejected += invoice.status === "rejected" ? 1 : 0;
    current.observed += invoice.status === "observed" ? 1 : 0;
    current.alerts += invoice.alerts.length;
    map.set(key, current);
  }
  return [...map.values()].sort((a, b) => b.rejected - a.rejected || b.alerts - a.alerts);
}

export function getTariffComparison(alerts: AuditAlert[]) {
  return alerts.filter((alert) => ["tariff_price", "missing_tariff", "labor_hours", "unauthorized_item"].includes(alert.type));
}

export function searchInvoices(invoices: Awaited<ReturnType<typeof listInvoices>>, query: string) {
  const q = normalizeText(query);
  return invoices.filter((invoice) => normalizeText(`${invoice.invoiceNumber} ${invoice.claimNumber} ${invoice.workshopName} ${invoice.insuredName}`).includes(q));
}
