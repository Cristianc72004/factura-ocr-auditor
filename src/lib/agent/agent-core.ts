import type { AgentRequest, AgentResponse } from "./agent-types";
import { getMemory, updateMemory } from "./conversation-memory";
import { retrieveContext } from "./context-retriever";
import { detectIntent } from "./intent-detector";
import { createQueryPlan } from "./query-planner";
import { composeResponse, contextUsed } from "./response-composer";
import { reason } from "./reasoning-engine";

function suggestions(pageContext?: AgentRequest["pageContext"], hasInvoice?: boolean) {
  if (pageContext === "case_detail" || hasInvoice) {
    return ["Resumir este caso", "Explicar alertas", "Comparar contra tarifario", "Buscar duplicados", "Que recomienda el sistema"];
  }
  if (pageContext === "dashboard") {
    return ["Resume el estado del dia", "Ver casos criticos", "Que debo revisar primero", "Que talleres tienen mas alertas"];
  }
  if (pageContext === "upload") return ["Como esta la base para auditar", "Ver casos criticos", "Que valida el motor"];
  if (pageContext === "generator") return ["Como generar facturas utiles", "Resume el estado del dia", "Que debo auditar luego"];
  return ["Buscar factura", "Priorizar revision", "Explicar regla de riesgo", "Analizar talleres"];
}

export async function runAgent(request: AgentRequest): Promise<AgentResponse> {
  const memory = getMemory(request.sessionId);
  const intent = detectIntent(request.message);
  const plan = createQueryPlan(intent, request.message);
  const context = await retrieveContext(plan, memory, request.currentCaseId || request.currentInvoiceId);
  const result = reason(plan, context, request.message);
  const reply = composeResponse(result);

  updateMemory(request.sessionId, {
    adminMessage: request.message,
    agentReply: reply,
    intent,
    invoiceId: context.matchedInvoice?.id,
    invoiceNumber: context.matchedInvoice?.invoiceNumber,
    claimNumber: context.matchedClaim?.claimNumber || context.matchedInvoice?.claimNumber,
    workshopName: context.matchedInvoice?.workshopName,
  });

  return {
    success: true,
    reply,
    intent,
    contextUsed: contextUsed(result),
    suggestions: suggestions(request.pageContext, Boolean(context.matchedInvoice)),
    insights: result.insights,
  };
}
