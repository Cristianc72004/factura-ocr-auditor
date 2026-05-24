import { formatCurrency } from "@/lib/utils";
import type { AgentContext, AgentPlan, AgentResult } from "./agent-types";
import { getCriticalAlerts, getDuplicateCandidates, getObservedInvoices, getRejectedInvoices, getTariffComparison, getWorkshopSummary } from "./audit-agent-tools";
import { explainRule } from "./knowledge-base";

function invoiceHref(id?: string) {
  return id ? `/cases/${id}` : undefined;
}

function topAlert(context: AgentContext) {
  const order = { critical: 4, high: 3, medium: 2, low: 1 };
  return [...context.alerts].sort((a, b) => order[b.severity] - order[a.severity])[0];
}

function baseSummary(context: AgentContext) {
  const d = context.dashboard;
  return `${d.policies} polizas, ${d.claims} siniestros, ${d.workshops} talleres y ${d.tariffs} conceptos de tarifario`;
}

export function reason(plan: AgentPlan, context: AgentContext, message: string): AgentResult {
  const invoice = context.matchedInvoice;
  const claim = context.matchedClaim;
  const sources = new Set<string>();

  if (plan.intent === "saludo") {
    return {
      reply: "Hola. Puedo revisar prioridades, casos criticos, talleres con alertas o explicar una factura cuando abras un caso.",
      confidence: 0.95,
      sources: ["KnowledgeBase"],
      reasoning: ["saludo detectado"],
      insights: [],
    };
  }

  if (plan.intent === "ayuda") {
    return {
      reply: "Puedes pedirme: ver casos criticos, resumir el estado del dia, priorizar revision, analizar talleres, buscar una factura o explicar por que un caso fue observado.",
      confidence: 0.95,
      sources: ["KnowledgeBase"],
      reasoning: ["ayuda solicitada"],
      insights: [],
    };
  }

  if (plan.intent === "consulta_dashboard") {
    sources.add("Invoice");
    const d = context.dashboard;
    return {
      reply: d.total
        ? `Estado actual: ${d.total} facturas auditadas, ${d.approved} aprobadas, ${d.observed} observadas y ${d.rejected} rechazadas. Hay ${d.criticalAlerts} alertas criticas.`
        : `Todavia no hay facturas auditadas. La base administrativa tiene ${baseSummary(context)} registrados para iniciar validaciones.`,
      confidence: 0.92,
      sources: [...sources],
      reasoning: ["metricas agregadas del dashboard"],
      insights: [
        { label: "Aprobadas", value: String(d.approved), tone: "success" },
        { label: "Observadas", value: String(d.observed), tone: "warning" },
        { label: "Rechazadas", value: String(d.rejected), tone: "danger" },
      ],
    };
  }

  if (plan.intent === "priorizar_revision" || plan.intent === "recomendacion_auditor") {
    sources.add("Invoice");
    sources.add("AuditAlert");
    const candidates = [...getRejectedInvoices(context.invoices), ...getObservedInvoices(context.invoices)]
      .sort((a, b) => b.riskScore - a.riskScore || Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 3);
    if (!candidates.length) {
      return {
        reply: context.dashboard.total
          ? "No hay facturas observadas o rechazadas pendientes. Hoy no hay revision humana prioritaria."
          : `No hay facturas auditadas para priorizar. Primero confirma la base: ${baseSummary(context)}. Luego genera o sube una factura para activar la auditoria.`,
        confidence: 0.88,
        sources: [...sources],
        reasoning: ["no hay casos pendientes"],
        insights: [],
      };
    }
    return {
      reply: `Prioriza ${candidates[0].invoiceNumber}: estado ${candidates[0].status}, riesgo ${candidates[0].riskScore}/100 y ${candidates[0].alerts.length} alertas. Luego revisa ${candidates.slice(1).map((item) => item.invoiceNumber).join(", ") || "los nuevos casos entrantes"}.`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["orden por riesgo y recencia"],
      insights: candidates.map((item) => ({ label: item.invoiceNumber, value: `${item.riskScore}/100`, tone: item.status === "rejected" ? "danger" : "warning", href: invoiceHref(item.id) })),
    };
  }

  if (plan.intent === "analizar_taller") {
    sources.add("Workshop");
    sources.add("Invoice");
    const ranking = getWorkshopSummary(context.invoices).slice(0, 5);
    if (!ranking.length) {
      return { reply: `Todavia no hay facturas auditadas para calcular patrones por taller. Hay ${context.dashboard.workshops} talleres conveniados registrados.`, confidence: 0.86, sources: [...sources], reasoning: ["sin facturas"], insights: [] };
    }
    const leader = ranking[0];
    return {
      reply: `El taller con mayor atencion es ${leader.workshopName}: ${leader.total} facturas, ${leader.rejected} rechazadas, ${leader.observed} observadas y ${leader.alerts} alertas acumuladas.`,
      confidence: 0.88,
      sources: [...sources, "AuditAlert"],
      reasoning: ["ranking por rechazos y alertas"],
      insights: ranking.map((item) => ({ label: item.workshopName, value: `${item.rejected} rechazos / ${item.alerts} alertas`, tone: item.rejected ? "danger" : item.observed ? "warning" : "neutral" })),
    };
  }

  if (plan.intent === "listar_alertas") {
    sources.add("AuditAlert");
    sources.add("Invoice");
    const critical = getCriticalAlerts(context.invoices).slice(0, 5);
    if (!critical.length) {
      return {
        reply: context.dashboard.total
          ? "No hay alertas criticas registradas. Los casos auditados no tienen bloqueo critico por ahora."
          : `No hay casos criticos porque todavia no se auditaron facturas. La base lista hoy es: ${baseSummary(context)}.`,
        confidence: 0.9,
        sources: [...sources],
        reasoning: ["consulta de alertas criticas"],
        insights: [],
      };
    }
    return {
      reply: `Hay ${getCriticalAlerts(context.invoices).length} alertas criticas. La primera es ${critical[0].type} en la factura ${critical[0].invoice.invoiceNumber}: ${critical[0].message}`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["alertas criticas ordenadas"],
      insights: critical.map((item) => ({ label: item.invoice.invoiceNumber, value: item.type, tone: "danger", href: invoiceHref(item.invoice.id) })),
    };
  }

  if (plan.intent === "detectar_duplicado") {
    sources.add("Invoice");
    sources.add("AuditAlert");
    const duplicates = invoice
      ? invoice.alerts.filter((alert) => alert.type.includes("duplicate")).map((alert) => ({ invoice, alert }))
      : getDuplicateCandidates(context.invoices);
    if (!duplicates.length) return { reply: "No encontre señales de duplicado con los datos disponibles.", confidence: 0.82, sources: [...sources], reasoning: ["sin alertas duplicate"], insights: [] };
    return {
      reply: `Si hay señales de duplicado. La mas importante es ${duplicates[0].alert.type} en factura ${duplicates[0].invoice.invoiceNumber}: ${duplicates[0].alert.message}`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["alertas de duplicado encontradas"],
      insights: duplicates.slice(0, 3).map((item) => ({ label: item.invoice.invoiceNumber, value: item.alert.severity, tone: "danger", href: invoiceHref(item.invoice.id) })),
    };
  }

  if (plan.intent === "comparar_tarifario") {
    if (!invoice) return { reply: "Necesito una factura actual o un numero de factura para comparar contra tarifario.", confidence: 0.62, sources: ["TariffItem"], reasoning: ["falta factura"], insights: [] };
    sources.add("Invoice");
    sources.add("TariffItem");
    const tariffAlerts = getTariffComparison(invoice.alerts);
    if (!tariffAlerts.length) return { reply: `La factura ${invoice.invoiceNumber} no tiene alertas de tarifario registradas. Sus items estan dentro de los controles cargados.`, confidence: 0.86, sources: [...sources], reasoning: ["sin alertas tarifarias"], insights: [] };
    return {
      reply: `La factura ${invoice.invoiceNumber} tiene ${tariffAlerts.length} observaciones de tarifario. La principal: ${tariffAlerts[0].message}`,
      confidence: 0.9,
      sources: [...sources, "AuditAlert"],
      reasoning: ["alertas de tarifario filtradas"],
      insights: tariffAlerts.map((alert) => ({ label: alert.type, value: alert.severity, tone: alert.severity === "high" || alert.severity === "critical" ? "danger" : "warning" })),
    };
  }

  if (plan.intent === "explicar_regla") {
    return { reply: explainRule(message), confidence: 0.84, sources: ["KnowledgeBase"], reasoning: ["explicacion local de reglas"], insights: [] };
  }

  if (["resumen_caso", "explicar_alerta", "buscar_factura", "seguimiento_contextual"].includes(plan.intent)) {
    if (!invoice) {
      return {
        reply: context.dashboard.total
          ? "No tengo una factura actual en contexto. Abre el detalle de un caso o escribe el numero de factura para revisarla."
          : "Todavia no hay facturas auditadas. Para revisar un caso, primero genera o sube una factura y ejecuta la auditoria.",
        confidence: 0.58,
        sources: ["Invoice"],
        reasoning: ["factura no encontrada"],
        insights: [],
      };
    }
    sources.add("Invoice");
    sources.add("AuditAlert");
    if (claim) sources.add("Claim");
    const alert = topAlert(context);
    const parts = [
      `Factura ${invoice.invoiceNumber}: estado ${invoice.status}, riesgo ${invoice.riskScore}/100, total ${formatCurrency(invoice.total)}.`,
      `Taller: ${invoice.workshopName}. Siniestro: ${invoice.claimNumber}.`,
      invoice.alerts.length ? `Tiene ${invoice.alerts.length} alertas. La mas importante es ${alert?.severity}: ${alert?.message}` : "No tiene alertas registradas.",
      claim ? `El siniestro reporta: ${claim.reportedDamage}.` : "No encontre el siniestro asociado.",
    ];
    return {
      reply: parts.join(" "),
      confidence: 0.91,
      sources: [...sources],
      reasoning: ["resumen de factura", "alerta principal", "siniestro asociado"],
      insights: [
        { label: "Estado", value: invoice.status, tone: invoice.status === "approved" ? "success" : invoice.status === "observed" ? "warning" : "danger", href: invoiceHref(invoice.id) },
        { label: "Riesgo", value: `${invoice.riskScore}/100`, tone: invoice.riskScore > 70 ? "danger" : invoice.riskScore > 30 ? "warning" : "success" },
        { label: "Alertas", value: String(invoice.alerts.length), tone: invoice.alerts.length ? "warning" : "success" },
      ],
    };
  }

  if (plan.intent === "buscar_siniestro") {
    if (!claim) return { reply: "No encontre ese siniestro. Verifica el numero o busca por factura asociada.", confidence: 0.62, sources: ["Claim"], reasoning: ["siniestro no encontrado"], insights: [] };
    const related = context.invoices.filter((item) => item.claimNumber === claim.claimNumber);
    return {
      reply: `Siniestro ${claim.claimNumber}: asegurado ${claim.insuredName}, vehiculo ${claim.vehicle} (${claim.licensePlate}). Dano reportado: ${claim.reportedDamage}. Tiene ${related.length} facturas auditadas asociadas.`,
      confidence: 0.9,
      sources: ["Claim", "Invoice"],
      reasoning: ["siniestro encontrado", "facturas relacionadas"],
      insights: related.map((item) => ({ label: item.invoiceNumber, value: item.status, href: invoiceHref(item.id), tone: item.status === "approved" ? "success" : item.status === "observed" ? "warning" : "danger" })),
    };
  }

  return {
    reply: "Puedo ayudarte, pero necesito un poco mas de contexto: indica una factura, un siniestro, un taller o pide una prioridad de revision.",
    confidence: 0.55,
    sources: ["KnowledgeBase"],
    reasoning: ["intencion desconocida"],
    insights: [],
  };
}
