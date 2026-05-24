import type { AgentContext, AgentPlan, ConversationMemory } from "./agent-types";
import { getAgentDataset, getClaimByInvoiceNumber, getClaimByNumber, getDashboardMetrics, getInvoiceById, getInvoiceByNumber } from "./audit-agent-tools";

export async function retrieveContext(plan: AgentPlan, memory: ConversationMemory, currentInvoiceId?: string): Promise<AgentContext> {
  const { invoices, claims, policies, workshops, tariffs } = await getAgentDataset();
  const currentInvoice = getInvoiceById(invoices, currentInvoiceId || memory.currentInvoiceId);
  const matchedInvoice =
    getInvoiceByNumber(invoices, plan.invoiceNumber) ||
    currentInvoice ||
    getInvoiceByNumber(invoices, memory.currentInvoiceNumber);
  const claimNumber = plan.claimNumber || matchedInvoice?.claimNumber || memory.currentClaimNumber;
  const matchedClaim = getClaimByNumber(claims, claimNumber) || getClaimByInvoiceNumber(claims, plan.invoiceNumber || matchedInvoice?.invoiceNumber);
  const alerts = matchedInvoice?.alerts ?? invoices.flatMap((invoice) => invoice.alerts).slice(0, 50);
  return {
    currentInvoice,
    matchedInvoice,
    matchedClaim,
    invoices,
    claims,
    policies,
    workshops,
    tariffs,
    alerts,
    dashboard: getDashboardMetrics(invoices, { policies, claims, workshops, tariffs }),
  };
}
