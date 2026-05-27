import { listClaims, listInvoices, listPolicies, listTariffs, listWorkshops } from "@/lib/db";
import { normalizeText } from "@/lib/utils";

type LocalDataset = Awaited<ReturnType<typeof loadAgentDataset>>;

export async function loadAgentDataset() {
  const [invoices, claims, policies, workshops, tariffs] = await Promise.all([
    listInvoices(),
    listClaims(),
    listPolicies(),
    listWorkshops(),
    listTariffs(),
  ]);
  return { invoices, claims, policies, workshops, tariffs };
}

export async function getDashboardSummary(dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  const alerts = data.invoices.flatMap((invoice) => invoice.alerts);
  return {
    totalInvoices: data.invoices.length,
    approved: data.invoices.filter((invoice) => invoice.status === "approved").length,
    observed: data.invoices.filter((invoice) => invoice.status === "observed").length,
    rejected: data.invoices.filter((invoice) => invoice.status === "rejected").length,
    criticalAlerts: alerts.filter((alert) => alert.severity === "critical").length,
    highAlerts: alerts.filter((alert) => alert.severity === "high").length,
    policies: data.policies.length,
    claims: data.claims.length,
    workshops: data.workshops.length,
    tariffs: data.tariffs.length,
  };
}

export async function searchInvoices(query = "", dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  const normalized = normalizeText(query);
  return data.invoices
    .filter((invoice) => !normalized || normalizeText(`${invoice.invoiceNumber} ${invoice.claimNumber} ${invoice.workshopName} ${invoice.insuredName} ${invoice.status}`).includes(normalized))
    .slice(0, 8);
}

export async function getCriticalAlerts(dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  return data.invoices
    .flatMap((invoice) => invoice.alerts.map((alert) => ({ invoiceNumber: invoice.invoiceNumber, claimNumber: invoice.claimNumber, workshopName: invoice.workshopName, status: invoice.status, riskScore: invoice.riskScore, alert })))
    .filter((item) => item.alert.severity === "critical")
    .slice(0, 8);
}

export async function getObservedInvoices(dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  return data.invoices.filter((invoice) => invoice.status === "observed").slice(0, 8);
}

export async function getRejectedInvoices(dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  return data.invoices.filter((invoice) => invoice.status === "rejected").slice(0, 8);
}

export async function getInvoiceByNumber(invoiceNumber: string, dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  const normalized = normalizeText(invoiceNumber);
  return data.invoices.find((invoice) => normalizeText(invoice.invoiceNumber) === normalized) ?? null;
}

export async function getClaimByNumber(claimNumber: string, dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  const normalized = normalizeText(claimNumber);
  return data.claims.find((claim) => normalizeText(claim.claimNumber) === normalized) ?? null;
}

export async function getWorkshopsWithMostAlerts(dataset?: LocalDataset) {
  const data = dataset ?? (await loadAgentDataset());
  const grouped = new Map<string, { workshopName: string; invoices: number; observed: number; rejected: number; alerts: number }>();
  for (const invoice of data.invoices) {
    const key = normalizeText(invoice.workshopName || "sin taller");
    const current = grouped.get(key) ?? { workshopName: invoice.workshopName || "Sin taller", invoices: 0, observed: 0, rejected: 0, alerts: 0 };
    current.invoices += 1;
    current.observed += invoice.status === "observed" ? 1 : 0;
    current.rejected += invoice.status === "rejected" ? 1 : 0;
    current.alerts += invoice.alerts.length;
    grouped.set(key, current);
  }
  return [...grouped.values()].sort((a, b) => b.alerts - a.alerts || b.rejected - a.rejected).slice(0, 6);
}
