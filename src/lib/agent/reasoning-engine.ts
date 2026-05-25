import { formatCurrency } from "@/lib/utils";
import type { AgentContext, AgentPlan, AgentResult } from "./agent-types";
import {
  getCriticalAlerts,
  getDuplicateCandidates,
  getObservedInvoices,
  getRejectedInvoices,
  getTariffComparison,
  getWorkshopSummary,
} from "./audit-agent-tools";
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
  return `${d.policies} polizas, ${d.claims} reportes, ${d.workshops} talleres y ${d.tariffs} conceptos de tarifario`;
}

function alertCount(context: AgentContext, type: string) {
  return context.invoices.reduce((total, invoice) => total + invoice.alerts.filter((alert) => alert.type === type).length, 0);
}

function claimForInvoice(context: AgentContext, invoiceNumber?: string) {
  return context.claims.find((claim) => claim.invoiceNumber === invoiceNumber);
}

function groupedAlerts(alerts: AgentContext["alerts"]) {
  const groups = new Map<string, number>();
  for (const alert of alerts) groups.set(alert.type, (groups.get(alert.type) ?? 0) + 1);
  return [...groups.entries()].sort((a, b) => b[1] - a[1]);
}

function commonCaseInsights(invoice: NonNullable<AgentContext["matchedInvoice"]>) {
  return [
    {
      label: "Estado",
      value: invoice.status,
      tone: invoice.status === "approved" ? "success" as const : invoice.status === "observed" ? "warning" as const : "danger" as const,
      href: invoiceHref(invoice.id),
    },
    {
      label: "Riesgo",
      value: `${invoice.riskScore}/100`,
      tone: invoice.riskScore > 70 ? "danger" as const : invoice.riskScore > 30 ? "warning" as const : "success" as const,
    },
    { label: "Alertas", value: String(invoice.alerts.length), tone: invoice.alerts.length ? "warning" as const : "success" as const },
  ];
}

export function reason(plan: AgentPlan, context: AgentContext, message: string): AgentResult {
  const invoice = context.matchedInvoice;
  const claim = context.matchedClaim;
  const sources = new Set<string>();

  if (plan.intent === "saludo") {
    return {
      reply: "Hola. Puedo ayudarte a seguir el flujo completo: reporte del cliente, factura del taller, cruces de validacion, alertas y decision del auditor.",
      confidence: 0.95,
      sources: ["KnowledgeBase"],
      reasoning: ["saludo detectado"],
      insights: [],
      suggestions: ["Explicar flujo", "Que datos faltan", "Ver casos criticos"],
    };
  }

  if (plan.intent === "ayuda") {
    return {
      reply: [
        "Puedo actuar como copiloto del auditor.",
        "Entiendo preguntas con errores comunes de escritura y trato de inferir la intencion. Por ejemplo: 'facrura' como factura, 'sinietro' como siniestro, 'fljo' como flujo, 'tarifa' como tarifario.",
        "Me puedes pedir que explique el flujo, revise datos faltantes, resuma una factura, compare contra tarifario, detecte duplicados, analice discrepancias entre reporte y factura o priorice casos.",
      ].join("\n"),
      confidence: 0.95,
      sources: ["KnowledgeBase"],
      reasoning: ["ayuda solicitada"],
      insights: [],
      suggestions: ["Explicar flujo", "Que discrepancias detectas", "Priorizar revision"],
    };
  }

  if (plan.intent === "explicar_flujo") {
    const mentionsTypos = /ortograf|mal escrito|predecir|interpretar/i.test(message);
    const mentionsGenerator = /generador|generar|pdf de prueba|crear ejemplo|factura de prueba/i.test(message);
    const nextStep = !context.dashboard.policies
      ? "Carga polizas/clientes."
      : !context.dashboard.claims
        ? "Registra reportes de siniestro."
        : !context.dashboard.workshops || !context.dashboard.tariffs
          ? "Completa convenios de talleres y tarifario."
          : !context.dashboard.total
            ? "Sube o genera una factura del taller para auditar."
            : context.dashboard.observed || context.dashboard.rejected
              ? "Revisa primero los casos observados o rechazados."
              : "Puedes seguir auditando nuevas facturas.";
    return {
      reply: [
        "Flujo de trabajo del auditor:",
        "1. Clientes y polizas: registra asegurado, vehiculo, placa, cobertura, deducible y limite. Esto permite saber si el cliente esta cubierto.",
        "2. Talleres y convenio: registra talleres permitidos, categorias, monto maximo y condiciones. Esto valida si el taller puede cobrar.",
        "3. Tarifario: carga precios maximos, horas maximas y conceptos autorizados. Esto detecta sobreprecios e items fuera de convenio.",
        "4. Reporte de siniestro: registra lo que declara el cliente: numero de siniestro, factura informada, dano, servicios autorizados y taller permitido.",
        "5. Generador de facturas: usalo para crear un PDF de prueba basado en un siniestro ya registrado. Sirve para practicar, probar OCR y validar reglas sin depender de una factura externa.",
        "6. Subir factura: carga la factura real del taller o la generada. El sistema lee el documento por OCR y permite corregir datos.",
        "7. Auditoria automatica: cruza factura vs poliza, siniestro, taller, tarifario, danos, items, totales y duplicados.",
        "8. Casos: revisa el reporte final. Las aprobadas pueden pasar, las observadas o rechazadas van a revision humana.",
        mentionsGenerator ? "Uso practico del generador: entra a Generador, elige un reporte de siniestro, selecciona taller, genera un PDF, descargalo o prueba reconocimiento. Luego puedes subir ese PDF en Carga para auditarlo como si fuera una factura del taller." : "",
        `Siguiente paso sugerido: ${nextStep}`,
        mentionsTypos ? "Si escribes con errores, intentare corregir la intencion antes de consultar datos. Ejemplos: facrura=factura, sinietro=siniestro, fljo=flujo, tarifa=tarifario." : "",
      ].join("\n"),
      confidence: 0.96,
      sources: ["KnowledgeBase"],
      reasoning: ["flujo operativo"],
      insights: [
        { label: "Reportes", value: String(context.dashboard.claims), tone: "neutral" },
        { label: "Facturas", value: String(context.dashboard.total), tone: "neutral" },
        { label: "Criticas", value: String(context.dashboard.criticalAlerts), tone: context.dashboard.criticalAlerts ? "danger" : "success" },
      ],
      suggestions: ["Como uso el generador", "Que datos faltan", "Que valida el motor", "Subir factura ahora"],
    };
  }

  if (plan.intent === "datos_faltantes") {
    const claimsWithoutInvoice = context.claims.filter((item) => !item.invoiceNumber).length;
    const invoicesWithoutClaim = context.invoices.filter((item) => !context.claims.some((claimItem) => claimItem.claimNumber === item.claimNumber)).length;
    const missingClaimAlerts = alertCount(context, "missing_claim");
    const missingTariffs = alertCount(context, "missing_tariff");
    const missingWorkshops = alertCount(context, "missing_workshop_agreement");
    const blockers = [
      context.dashboard.policies === 0 ? "faltan polizas de clientes" : "",
      context.dashboard.claims === 0 ? "faltan reportes de siniestro del cliente" : "",
      context.dashboard.workshops === 0 ? "faltan talleres conveniados" : "",
      context.dashboard.tariffs === 0 ? "falta tarifario acordado" : "",
      invoicesWithoutClaim ? `${invoicesWithoutClaim} factura(s) sin reporte de siniestro vinculado` : "",
      claimsWithoutInvoice ? `${claimsWithoutInvoice} reporte(s) sin numero de factura informada` : "",
      missingTariffs ? `${missingTariffs} item(s) sin tarifario` : "",
      missingWorkshops ? `${missingWorkshops} factura(s) con taller sin convenio` : "",
      missingClaimAlerts ? `${missingClaimAlerts} alerta(s) por siniestro pendiente` : "",
    ].filter(Boolean);
    return {
      reply: blockers.length
        ? `Datos pendientes detectados: ${blockers.join("; ")}. Prioriza completar esos puntos antes de aprobar pagos.`
        : "La base minima esta completa: hay polizas, reportes de siniestro, talleres, tarifario y facturas vinculadas. Puedes enfocarte en las alertas de riesgo.",
      confidence: 0.9,
      sources: ["Invoice", "Claim", "Policy", "Workshop", "TariffItem"],
      reasoning: ["revision de completitud"],
      insights: [
        { label: "Reportes sin factura", value: String(claimsWithoutInvoice), tone: claimsWithoutInvoice ? "warning" : "success" },
        { label: "Facturas sin reporte", value: String(invoicesWithoutClaim), tone: invoicesWithoutClaim ? "warning" : "success" },
        { label: "Items sin tarifario", value: String(missingTariffs), tone: missingTariffs ? "warning" : "success" },
      ],
      suggestions: ["Explicar flujo", "Ver casos criticos", "Comparar reporte con factura"],
    };
  }

  if (plan.intent === "analizar_discrepancias") {
    sources.add("Invoice");
    sources.add("Claim");
    sources.add("AuditAlert");
    if (invoice) {
      const relatedClaim = claim || claimForInvoice(context, invoice.invoiceNumber);
      const groups = groupedAlerts(invoice.alerts);
      const mismatch = relatedClaim?.invoiceNumber && relatedClaim.invoiceNumber !== invoice.invoiceNumber;
      return {
        reply: [
          invoice.alerts.length ? `La factura ${invoice.invoiceNumber} tiene ${invoice.alerts.length} discrepancia(s).` : `La factura ${invoice.invoiceNumber} no tiene discrepancias registradas.`,
          relatedClaim ? `Reporte del cliente: siniestro ${relatedClaim.claimNumber}, factura informada ${relatedClaim.invoiceNumber || "sin dato"}, dano: ${relatedClaim.reportedDamage}.` : "No encontre reporte del cliente vinculado.",
          mismatch ? "Hay diferencia entre la factura informada por el cliente y la factura del taller." : "El numero de factura del reporte no presenta diferencia registrada.",
          groups.length ? `Alertas principales: ${groups.map(([type, count]) => `${type} (${count})`).join(", ")}.` : "No hay alertas agrupadas.",
        ].join("\n"),
        confidence: 0.92,
        sources: [...sources],
        reasoning: ["cruce factura-reporte-alertas"],
        insights: commonCaseInsights(invoice).concat({ label: "Reporte", value: relatedClaim ? "vinculado" : "faltante", tone: relatedClaim ? "success" : "warning" }),
        suggestions: ["Comparar contra tarifario", "Buscar duplicados", "Que recomienda el sistema"],
      };
    }
    const groups = groupedAlerts(context.invoices.flatMap((item) => item.alerts));
    return {
      reply: groups.length
        ? `Discrepancias mas frecuentes: ${groups.slice(0, 5).map(([type, count]) => `${type} (${count})`).join(", ")}. Abre un caso para ver el cruce especifico entre reporte del cliente y factura del taller.`
        : "No hay discrepancias registradas todavia. Cuando audites facturas, aqui podre resumir diferencias por reporte, tarifario, duplicados y totales.",
      confidence: 0.86,
      sources: [...sources],
      reasoning: ["agregacion de alertas"],
      insights: groups.slice(0, 4).map(([type, count]) => ({ label: type, value: String(count), tone: "warning" as const })),
      suggestions: ["Ver casos criticos", "Priorizar revision", "Que datos faltan"],
    };
  }

  if (plan.intent === "consulta_dashboard") {
    sources.add("Invoice");
    const d = context.dashboard;
    return {
      reply: d.total
        ? `Estado actual: ${d.total} facturas auditadas, ${d.approved} aprobadas, ${d.observed} observadas y ${d.rejected} rechazadas. Hay ${d.criticalAlerts} alertas criticas. Base: ${baseSummary(context)}.`
        : `Todavia no hay facturas auditadas. La base administrativa tiene ${baseSummary(context)} registrados para iniciar validaciones.`,
      confidence: 0.92,
      sources: [...sources],
      reasoning: ["metricas agregadas del dashboard"],
      insights: [
        { label: "Aprobadas", value: String(d.approved), tone: "success" },
        { label: "Observadas", value: String(d.observed), tone: "warning" },
        { label: "Rechazadas", value: String(d.rejected), tone: "danger" },
      ],
      suggestions: ["Que discrepancias detectas", "Que datos faltan", "Priorizar revision"],
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
          : `No hay facturas auditadas para priorizar. Primero confirma la base: ${baseSummary(context)}. Luego sube una factura para activar la auditoria.`,
        confidence: 0.88,
        sources: [...sources],
        reasoning: ["no hay casos pendientes"],
        insights: [],
        suggestions: ["Explicar flujo", "Subir factura ahora"],
      };
    }
    return {
      reply: `Prioriza ${candidates[0].invoiceNumber}: estado ${candidates[0].status}, riesgo ${candidates[0].riskScore}/100 y ${candidates[0].alerts.length} alertas. Luego revisa ${candidates.slice(1).map((item) => item.invoiceNumber).join(", ") || "los nuevos casos entrantes"}.`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["orden por riesgo y recencia"],
      insights: candidates.map((item) => ({ label: item.invoiceNumber, value: `${item.riskScore}/100`, tone: item.status === "rejected" ? "danger" : "warning", href: invoiceHref(item.id) })),
      suggestions: ["Explicar discrepancias", "Comparar contra tarifario", "Buscar duplicados"],
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
      suggestions: ["Que discrepancias detectas", "Ver casos criticos"],
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
        suggestions: ["Que datos faltan", "Explicar flujo"],
      };
    }
    return {
      reply: `Hay ${getCriticalAlerts(context.invoices).length} alertas criticas. La primera es ${critical[0].type} en la factura ${critical[0].invoice.invoiceNumber}: ${critical[0].message}`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["alertas criticas ordenadas"],
      insights: critical.map((item) => ({ label: item.invoice.invoiceNumber, value: item.type, tone: "danger", href: invoiceHref(item.invoice.id) })),
      suggestions: ["Priorizar revision", "Explicar discrepancias"],
    };
  }

  if (plan.intent === "detectar_duplicado") {
    sources.add("Invoice");
    sources.add("AuditAlert");
    const duplicates = invoice
      ? invoice.alerts.filter((alert) => alert.type.includes("duplicate")).map((alert) => ({ invoice, alert }))
      : getDuplicateCandidates(context.invoices);
    if (!duplicates.length) return { reply: "No encontre senales de duplicado con los datos disponibles.", confidence: 0.82, sources: [...sources], reasoning: ["sin alertas duplicate"], insights: [], suggestions: ["Comparar reporte con factura"] };
    return {
      reply: `Si hay senales de duplicado. La mas importante es ${duplicates[0].alert.type} en factura ${duplicates[0].invoice.invoiceNumber}: ${duplicates[0].alert.message}`,
      confidence: 0.9,
      sources: [...sources],
      reasoning: ["alertas de duplicado encontradas"],
      insights: duplicates.slice(0, 3).map((item) => ({ label: item.invoice.invoiceNumber, value: item.alert.severity, tone: "danger", href: invoiceHref(item.invoice.id) })),
      suggestions: ["Explicar discrepancias", "Priorizar revision"],
    };
  }

  if (plan.intent === "comparar_tarifario") {
    if (!invoice) return { reply: "Necesito una factura actual o un numero de factura para comparar contra tarifario.", confidence: 0.62, sources: ["TariffItem"], reasoning: ["falta factura"], insights: [], suggestions: ["Ver casos criticos"] };
    sources.add("Invoice");
    sources.add("TariffItem");
    const tariffAlerts = getTariffComparison(invoice.alerts);
    if (!tariffAlerts.length) return { reply: `La factura ${invoice.invoiceNumber} no tiene alertas de tarifario registradas. Sus items estan dentro de los controles cargados.`, confidence: 0.86, sources: [...sources], reasoning: ["sin alertas tarifarias"], insights: commonCaseInsights(invoice), suggestions: ["Comparar reporte con factura"] };
    return {
      reply: `La factura ${invoice.invoiceNumber} tiene ${tariffAlerts.length} observaciones de tarifario. La principal: ${tariffAlerts[0].message}`,
      confidence: 0.9,
      sources: [...sources, "AuditAlert"],
      reasoning: ["alertas de tarifario filtradas"],
      insights: tariffAlerts.map((alert) => ({ label: alert.type, value: alert.severity, tone: alert.severity === "high" || alert.severity === "critical" ? "danger" : "warning" })),
      suggestions: ["Explicar discrepancias", "Que item revisar", "Que recomienda el sistema"],
    };
  }

  if (plan.intent === "explicar_regla") {
    const typoHelp = /ortograf|interpretar|predecir|error/.test(message.toLowerCase())
      ? "\n\nTambien interpreto errores comunes de escritura. Por ejemplo: 'sinietro' lo trato como siniestro, 'facrura' como factura, 'tarifa' como tarifario y 'fljo' como flujo."
      : "";
    return { reply: `${explainRule(message)}${typoHelp}`, confidence: 0.84, sources: ["KnowledgeBase"], reasoning: ["explicacion local de reglas"], insights: [], suggestions: ["Explicar flujo", "Que datos faltan"] };
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
        suggestions: ["Ver casos criticos", "Explicar flujo"],
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
      claim ? `Reporte del cliente: factura informada ${claim.invoiceNumber || "sin dato"}, dano ${claim.reportedDamage}.` : "No encontre el reporte del cliente asociado.",
    ];
    return {
      reply: parts.join("\n"),
      confidence: 0.91,
      sources: [...sources],
      reasoning: ["resumen de factura", "alerta principal", "siniestro asociado"],
      insights: commonCaseInsights(invoice),
      suggestions: ["Explicar discrepancias", "Comparar contra tarifario", "Buscar duplicados"],
    };
  }

  if (plan.intent === "buscar_siniestro") {
    if (!claim) return { reply: "No encontre ese siniestro. Verifica el numero o busca por factura asociada.", confidence: 0.62, sources: ["Claim"], reasoning: ["siniestro no encontrado"], insights: [], suggestions: ["Que datos faltan"] };
    const related = context.invoices.filter((item) => item.claimNumber === claim.claimNumber || item.invoiceNumber === claim.invoiceNumber);
    return {
      reply: `Siniestro ${claim.claimNumber}: asegurado ${claim.insuredName}, vehiculo ${claim.vehicle} (${claim.licensePlate}). Factura informada por cliente: ${claim.invoiceNumber || "sin dato"}. Dano reportado: ${claim.reportedDamage}. Tiene ${related.length} factura(s) auditadas asociadas.`,
      confidence: 0.9,
      sources: ["Claim", "Invoice"],
      reasoning: ["siniestro encontrado", "facturas relacionadas"],
      insights: related.map((item) => ({ label: item.invoiceNumber, value: item.status, href: invoiceHref(item.id), tone: item.status === "approved" ? "success" : item.status === "observed" ? "warning" : "danger" })),
      suggestions: ["Comparar reporte con factura", "Priorizar revision"],
    };
  }

  return {
    reply: "Puedo ayudarte, pero necesito un poco mas de contexto: dime si quieres revisar flujo, datos faltantes, una factura, un siniestro, un taller o una prioridad de revision.",
    confidence: 0.55,
    sources: ["KnowledgeBase"],
    reasoning: ["intencion desconocida"],
    insights: [],
    suggestions: ["Explicar flujo", "Que datos faltan", "Ver casos criticos"],
  };
}
