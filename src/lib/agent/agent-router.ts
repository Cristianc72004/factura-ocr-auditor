import { normalizeAgentMessage } from "./agent-context";
import type { AgentIntent } from "./agent-types";

export type RoutedAgentRequest = {
  intent: AgentIntent;
  invoiceNumber?: string;
  claimNumber?: string;
  topic?: string;
};

function extractCode(message: string, prefixes: string[]) {
  for (const prefix of prefixes) {
    const match = message.match(new RegExp(`${prefix}\\s*[:#-]?\\s*([a-z0-9-]+)`, "i"));
    if (match?.[1]) return match[1].toUpperCase();
  }
  return undefined;
}

export function routeAgentMessage(message: string, currentInvoiceNumber?: string): RoutedAgentRequest {
  const normalized = normalizeAgentMessage(message);
  const invoiceNumber = extractCode(message, ["factura", "invoice"]) || currentInvoiceNumber;
  const claimNumber = extractCode(message, ["siniestro", "claim"]);

  if (/^(hola|buenas|ayuda)/.test(normalized)) return { intent: "ayuda", invoiceNumber, claimNumber, topic: "ayuda" };
  if (normalized.includes("flujo") || normalized.includes("como funciona")) return { intent: "explicar_flujo", invoiceNumber, claimNumber, topic: "flujo" };
  if (normalized.includes("dashboard") || normalized.includes("resumen")) return { intent: "consulta_dashboard", invoiceNumber, claimNumber, topic: "dashboard" };
  if (normalized.includes("alerta") || normalized.includes("critica")) return { intent: "listar_alertas", invoiceNumber, claimNumber, topic: "alertas" };
  if (normalized.includes("taller")) return { intent: "analizar_taller", invoiceNumber, claimNumber, topic: "talleres" };
  if (normalized.includes("tarifario") || normalized.includes("precio") || normalized.includes("tarifa")) return { intent: "comparar_tarifario", invoiceNumber, claimNumber, topic: "tarifario" };
  if (normalized.includes("valida") || normalized.includes("validar") || normalized.includes("motor") || normalized.includes("regla")) return { intent: "explicar_regla", invoiceNumber, claimNumber, topic: "auditoria" };
  if (normalized.includes("ocr") || normalized.includes("leer documento")) return { intent: "explicar_regla", invoiceNumber, claimNumber, topic: "ocr" };
  if (normalized.includes("uuid") || normalized.includes("duplicado") || normalized.includes("repetido")) return { intent: "detectar_duplicado", invoiceNumber, claimNumber, topic: "duplicados" };
  if (normalized.includes("observada") || normalized.includes("observado") || normalized.includes("rejected") || normalized.includes("rechaz")) return { intent: "explicar_alerta", invoiceNumber, claimNumber, topic: "casos" };
  if (normalized.includes("revisar primero") || normalized.includes("prioridad") || normalized.includes("debo revisar")) return { intent: "priorizar_revision", invoiceNumber, claimNumber, topic: "revision humana" };
  if (normalized.includes("factura")) return { intent: "buscar_factura", invoiceNumber, claimNumber, topic: "facturas" };
  if (normalized.includes("siniestro")) return { intent: "buscar_siniestro", invoiceNumber, claimNumber, topic: "siniestros" };
  return { intent: "desconocido", invoiceNumber, claimNumber, topic: "auditoria" };
}

export function suggestionsForIntent(intent: AgentIntent) {
  const base = ["Explicame el flujo", "Resume el dashboard", "Que valida el motor", "Buscar alertas criticas"];
  if (intent === "listar_alertas") return ["Que debo revisar primero", "Que significa rejected", "Talleres con mas alertas", "UUID duplicado"];
  if (intent === "consulta_dashboard") return ["Que debo revisar primero", "Facturas observadas", "Facturas rechazadas", "Talleres con mas alertas"];
  if (intent === "buscar_factura" || intent === "explicar_alerta") return ["Por que fue observada", "Comparar con tarifario", "Ver siniestro asociado", "UUID duplicado"];
  return base;
}
