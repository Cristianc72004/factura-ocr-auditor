import type { AgentIntent, AgentPlan } from "./agent-types";

function findInvoiceNumber(message: string) {
  return message.match(/\b\d{4}-\d{8}\b/)?.[0];
}

function findClaimNumber(message: string) {
  return message.match(/\b\d{7,8}\b/)?.[0];
}

export function createQueryPlan(intent: AgentIntent, message: string): AgentPlan {
  const invoiceNumber = findInvoiceNumber(message);
  const claimNumber = findClaimNumber(message);
  const lower = message.toLowerCase();
  const workshopName = lower.includes("digitflow") ? "DigitFlow Solutions S.A.S." : undefined;
  const needsByIntent: Record<AgentIntent, string[]> = {
    resumen_caso: ["invoices", "claims", "alerts", "reviews"],
    explicar_alerta: ["invoices", "alerts", "claims", "tariffs"],
    buscar_factura: ["invoices", "claims", "alerts"],
    buscar_siniestro: ["claims", "invoices", "policies"],
    analizar_taller: ["workshops", "invoices", "alerts"],
    listar_alertas: ["alerts", "invoices"],
    priorizar_revision: ["invoices", "alerts", "dashboard"],
    comparar_tarifario: ["invoices", "tariffs", "alerts"],
    detectar_duplicado: ["invoices", "alerts"],
    explicar_regla: ["knowledge", "alerts"],
    consulta_dashboard: ["dashboard", "invoices", "alerts"],
    recomendacion_auditor: ["invoices", "alerts", "dashboard"],
    explicar_flujo: ["knowledge", "dashboard"],
    datos_faltantes: ["dashboard", "invoices", "claims", "policies", "workshops", "tariffs"],
    analizar_discrepancias: ["invoices", "claims", "alerts", "tariffs", "policies"],
    seguimiento_contextual: ["memory", "invoices", "alerts"],
    saludo: ["knowledge"],
    ayuda: ["knowledge"],
    desconocido: ["dashboard", "knowledge"],
  };
  return { intent, needs: needsByIntent[intent], invoiceNumber, claimNumber, workshopName };
}
