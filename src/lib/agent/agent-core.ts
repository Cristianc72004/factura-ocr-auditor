import type { AgentRequest, AgentResponse } from "./agent-types";
import { getMemory, updateMemory } from "./conversation-memory";
import { retrieveContext } from "./context-retriever";
import { detectIntent } from "./intent-detector";
import { createQueryPlan } from "./query-planner";
import { composeResponse, contextUsed } from "./response-composer";
import { reason } from "./reasoning-engine";

function suggestions(pageContext?: AgentRequest["pageContext"], hasInvoice?: boolean) {
  if (pageContext === "case_detail" || hasInvoice) {
    return ["Explicar discrepancias", "Comparar contra tarifario", "Buscar duplicados", "¿Qué ítem revisar?", "Qué recomienda el sistema"];
  }
  if (pageContext === "dashboard") {
    return ["Subir factura ahora", "¿Qué discrepancias detectas?", "¿Qué datos faltan?", "Ver casos críticos", "Explicar flujo"];
  }
  if (pageContext === "upload") return ["Qué valida el motor", "Comparar contra tarifario", "Ver casos críticos", "Qué datos faltan"];
  if (pageContext === "generator") return ["Cómo generar facturas útiles", "Qué discrepancias probar", "Qué debo auditar luego"];
  return ["Buscar factura", "Priorizar revisión", "Explicar regla de riesgo", "Analizar talleres"];
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
