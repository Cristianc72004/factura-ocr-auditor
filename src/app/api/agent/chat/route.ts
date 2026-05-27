import { NextResponse } from "next/server";
import { getRelevantContext, normalizeAgentMessage } from "@/lib/agent/agent-context";
import { getAgentMemory, updateAgentMemory } from "@/lib/agent/agent-memory";
import { routeAgentMessage, suggestionsForIntent } from "@/lib/agent/agent-router";
import {
  getClaimByNumber,
  getCriticalAlerts,
  getDashboardSummary,
  getInvoiceByNumber,
  getObservedInvoices,
  getRejectedInvoices,
  getWorkshopsWithMostAlerts,
  loadAgentDataset,
  searchInvoices,
} from "@/lib/agent/agent-tools";
import { generateWithOllama, getOllamaModel } from "@/lib/agent/ollama-client";
import { buildAgentPrompt } from "@/lib/agent/prompt-builder";
import type { AgentIntent, AgentRequest } from "@/lib/agent/agent-types";

type ChatRequest = AgentRequest & {
  currentInvoiceNumber?: string;
};

function compactInvoice(invoice: Awaited<ReturnType<typeof searchInvoices>>[number], maxAlerts = 3) {
  return {
    invoiceNumber: invoice.invoiceNumber,
    claimNumber: invoice.claimNumber,
    workshopName: invoice.workshopName,
    insuredName: invoice.insuredName,
    total: invoice.total,
    status: invoice.status,
    riskScore: invoice.riskScore,
    alerts: invoice.alerts.slice(0, maxAlerts).map((alert) => ({
      severity: alert.severity,
      type: alert.type,
      message: alert.message,
      field: alert.field,
      expectedValue: alert.expectedValue,
      actualValue: alert.actualValue,
    })),
  };
}

function compactClaim(claim: NonNullable<Awaited<ReturnType<typeof getClaimByNumber>>>) {
  return {
    claimNumber: claim.claimNumber,
    invoiceNumber: claim.invoiceNumber,
    policyNumber: claim.policyNumber,
    insuredName: claim.insuredName,
    vehicle: claim.vehicle,
    licensePlate: claim.licensePlate,
    reportedDamage: claim.reportedDamage,
    authorizedServices: claim.authorizedServices.slice(0, 5),
    status: claim.status,
  };
}

async function collectData(body: ChatRequest, routed: ReturnType<typeof routeAgentMessage>) {
  const dataset = await loadAgentDataset();
  const dashboard = await getDashboardSummary(dataset);
  const invoice = routed.invoiceNumber ? await getInvoiceByNumber(routed.invoiceNumber, dataset) : null;
  const claim = routed.claimNumber ? await getClaimByNumber(routed.claimNumber, dataset) : null;
  const data: Record<string, unknown> = {
    pageContext: body.pageContext || "sin pagina",
    dashboard,
  };

  if (invoice) data.currentInvoice = compactInvoice(invoice);
  if (claim) data.currentClaim = compactClaim(claim);

  if (["listar_alertas", "detectar_duplicado"].includes(routed.intent)) {
    data.criticalAlerts = await getCriticalAlerts(dataset);
  }

  if (routed.intent === "priorizar_revision") {
    data.criticalAlerts = await getCriticalAlerts(dataset);
    data.observedInvoices = (await getObservedInvoices(dataset)).slice(0, 4).map((item) => compactInvoice(item, 2));
    data.rejectedInvoices = (await getRejectedInvoices(dataset)).slice(0, 4).map((item) => compactInvoice(item, 2));
  }

  if (routed.intent === "consulta_dashboard") {
    data.workshopsWithMostAlerts = (await getWorkshopsWithMostAlerts(dataset)).slice(0, 3);
  }

  if (routed.intent === "analizar_taller") {
    data.workshopsWithMostAlerts = await getWorkshopsWithMostAlerts(dataset);
  }

  if (["buscar_factura", "buscar_siniestro", "explicar_alerta", "comparar_tarifario", "seguimiento_contextual"].includes(routed.intent) && !invoice && !claim) {
    data.searchResults = (await searchInvoices(body.message, dataset)).slice(0, 3).map((item) => compactInvoice(item, 2));
  }

  return { data, invoice, claim };
}

function numPredictForIntent(intent: AgentIntent) {
  if (["consulta_dashboard", "listar_alertas", "analizar_taller", "priorizar_revision"].includes(intent)) return 220;
  if (["buscar_factura", "buscar_siniestro", "explicar_alerta"].includes(intent)) return 240;
  return 150;
}

function fastReplyWithoutData(message: string, intent: AgentIntent, topic?: string) {
  const normalized = normalizeAgentMessage(message);

  if (intent === "ayuda") {
    return "Hola. Puedo ayudarte con facturas, siniestros, OCR, tarifario, alertas, talleres, reglas de auditoria y casos observed/rejected. Dime que quieres revisar.";
  }

  if (intent === "explicar_flujo") {
    return "Flujo recomendado: 1. carga clientes y polizas, 2. registra talleres, 3. define tarifario, 4. registra siniestro, 5. sube o genera factura, 6. ejecuta OCR y auditoria automatica, 7. revisa casos observed/rejected.";
  }

  if (intent === "explicar_regla" && topic === "ocr") {
    return "OCR lee el documento y extrae factura, siniestro, taller, asegurado, vehiculo, placa, UUID/CAE, items y totales. Luego esos datos se corrigen si hace falta y pasan al motor de auditoria.";
  }

  if (intent === "explicar_regla") {
    return "El motor valida factura contra siniestro, poliza, taller autorizado, tarifario, servicios permitidos, totales, duplicados y consistencia de vehiculo/placa. Con las alertas calcula riesgo y clasifica approved, observed o rejected.";
  }

  if (intent === "detectar_duplicado") {
    return "UUID duplicado significa que el identificador fiscal de una factura ya aparece en otra auditoria. Es una alerta critica porque puede indicar factura repetida o intento de doble cobro.";
  }

  if (normalized.includes("iso 9001")) {
    return "ISO 9001 es una norma internacional para sistemas de gestion de calidad. Define practicas para documentar procesos, controlar cambios, medir resultados, gestionar riesgos y mejorar continuamente la satisfaccion del cliente.";
  }

  if (normalized.includes("norma iso") || normalized.includes("normas iso")) {
    return "Las normas ISO son estandares internacionales que ayudan a ordenar procesos, calidad, seguridad, ambiente o gestion. En este sistema pueden servir como referencia para documentar controles, trazabilidad y mejora continua.";
  }

  return null;
}

function fastReplyForIntent(intent: AgentIntent, data: Record<string, unknown>) {
  const dashboard = data.dashboard as Awaited<ReturnType<typeof getDashboardSummary>>;

  if (intent === "consulta_dashboard") {
    return `Dashboard: ${dashboard.totalInvoices} facturas auditadas, ${dashboard.approved} approved, ${dashboard.observed} observed y ${dashboard.rejected} rejected. Hay ${dashboard.criticalAlerts} alertas criticas. Base cargada: ${dashboard.policies} polizas, ${dashboard.claims} siniestros, ${dashboard.workshops} talleres y ${dashboard.tariffs} items de tarifario.`;
  }

  if (intent === "listar_alertas") {
    const critical = data.criticalAlerts as Awaited<ReturnType<typeof getCriticalAlerts>> | undefined;
    if (!critical?.length) return "No hay alertas criticas registradas con los datos actuales. Revisa observed/rejected si necesitas priorizar casos manualmente.";
    const first = critical[0];
    return `Hay ${critical.length} alertas criticas. La primera esta en factura ${first.invoiceNumber}: ${first.alert.message}`;
  }

  if (intent === "analizar_taller") {
    const ranking = data.workshopsWithMostAlerts as Awaited<ReturnType<typeof getWorkshopsWithMostAlerts>> | undefined;
    if (!ranking?.length) return "Todavia no hay facturas suficientes para detectar talleres con mas alertas.";
    const leader = ranking[0];
    return `Taller con mas alertas: ${leader.workshopName}. Registra ${leader.alerts} alertas, ${leader.rejected} rechazadas, ${leader.observed} observadas y ${leader.invoices} facturas auditadas.`;
  }

  if (intent === "priorizar_revision") {
    if (!dashboard.observed && !dashboard.rejected && !dashboard.criticalAlerts) return "No hay casos observed/rejected ni alertas criticas para priorizar ahora.";
    return `Revisa primero rejected y alertas criticas (${dashboard.criticalAlerts}). Luego sigue con observed (${dashboard.observed}) por mayor riesgo y finalmente facturas recientes con diferencias contra siniestro o tarifario.`;
  }

  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as ChatRequest | null;
  if (!body?.message?.trim()) {
    return NextResponse.json({ success: false, error: "Mensaje vacio." }, { status: 400 });
  }

  const sessionId = body.sessionId || "default-admin-session";
  const memory = getAgentMemory(sessionId);
  const routed = routeAgentMessage(body.message, body.currentInvoiceNumber || memory.lastInvoiceNumber);
  const staticReply = fastReplyWithoutData(body.message, routed.intent, routed.topic);

  if (staticReply) {
    updateAgentMemory(sessionId, {
      userMessage: body.message,
      agentReply: staticReply,
      lastInvoiceNumber: routed.invoiceNumber,
      lastClaimNumber: routed.claimNumber,
      lastTopic: routed.topic,
      lastIntent: routed.intent,
    });

    return NextResponse.json({
      success: true,
      reply: staticReply,
      intent: routed.intent,
      suggestions: suggestionsForIntent(routed.intent),
      model: getOllamaModel(),
    });
  }

  const contextBlocks = getRelevantContext(body.message, 2);
  const { data, invoice, claim } = await collectData(body, routed);
  const prompt = buildAgentPrompt({ message: body.message, intent: routed.intent, contextBlocks, data, memory });
  const fastReply = fastReplyForIntent(routed.intent, data);

  try {
    const reply = fastReply ?? (await generateWithOllama({ prompt, numPredict: numPredictForIntent(routed.intent) }));
    updateAgentMemory(sessionId, {
      userMessage: body.message,
      agentReply: reply,
      lastInvoiceNumber: invoice?.invoiceNumber || routed.invoiceNumber,
      lastClaimNumber: claim?.claimNumber || routed.claimNumber,
      lastTopic: routed.topic,
      lastIntent: routed.intent,
    });

    return NextResponse.json({
      success: true,
      reply,
      intent: routed.intent,
      suggestions: suggestionsForIntent(routed.intent),
      model: getOllamaModel(),
    });
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : "No se pudo conectar con Ollama.";
    return NextResponse.json(
      {
        success: false,
        reply: `No pude consultar el modelo local ${getOllamaModel()}. Verifica que Ollama este activo en http://localhost:11434 y que el modelo este instalado. Detalle: ${message}`,
        intent: routed.intent,
        suggestions: ["ollama pull gemma2:2b", "ollama run gemma2:2b", "Resume el dashboard"],
        model: getOllamaModel(),
      },
      { status: 503 },
    );
  }
}
