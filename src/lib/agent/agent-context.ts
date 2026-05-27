import { normalizeText } from "@/lib/utils";

export type AgentContextBlock = {
  id: string;
  title: string;
  keywords: string[];
  content: string;
};

export const contextBlocks: AgentContextBlock[] = [
  {
    id: "flujo",
    title: "Flujo operativo",
    keywords: ["flujo", "sistema", "orden", "proceso", "pasos"],
    content: "El flujo recomendado es: cargar clientes y polizas, registrar talleres, definir tarifario, crear reporte de siniestro, generar o subir factura, ejecutar OCR, auditar automaticamente y enviar casos observed/rejected a revision humana.",
  },
  {
    id: "ocr",
    title: "OCR",
    keywords: ["ocr", "leer", "pdf", "documento", "extraer", "reconocimiento"],
    content: "OCR extrae numero de factura, siniestro, taller, asegurado, vehiculo, placa, UUID/CAE, items y totales. Luego el administrador puede revisar o corregir antes de auditar.",
  },
  {
    id: "auditoria",
    title: "Auditoria automatica",
    keywords: ["auditoria", "motor", "validar", "reglas", "valida", "automatico"],
    content: "El motor cruza factura contra siniestro, poliza, taller autorizado, tarifario, servicios autorizados, totales, duplicados y consistencia de vehiculo/placa. Genera alertas y clasifica approved, observed o rejected.",
  },
  {
    id: "tarifario",
    title: "Tarifario",
    keywords: ["tarifario", "tarifa", "precio", "mano de obra", "horas", "item"],
    content: "El tarifario define conceptos autorizados, precio maximo, categoria y horas maximas de mano de obra. Si un item no existe o supera valores acordados, se genera alerta.",
  },
  {
    id: "scoring",
    title: "Scoring de riesgo",
    keywords: ["scoring", "riesgo", "score", "puntaje", "clasificacion"],
    content: "El scoring suma severidades: critica +40, alta +25, media +15 y baja +5. El resultado orienta la decision automatica y la prioridad de revision.",
  },
  {
    id: "alertas",
    title: "Alertas",
    keywords: ["alerta", "critica", "alta", "media", "baja", "bloqueo"],
    content: "Las alertas explican discrepancias: duplicados, siniestro inexistente, poliza inactiva, taller no autorizado, precio sobre tarifario, item no autorizado o total inconsistente.",
  },
  {
    id: "casos",
    title: "Casos auditados",
    keywords: ["caso", "observado", "rechazado", "approved", "observed", "rejected"],
    content: "Approved indica que no hay alertas relevantes. Observed requiere revision humana por riesgo o discrepancias. Rejected indica bloqueo fuerte, por ejemplo alerta critica o riesgo alto.",
  },
  {
    id: "talleres",
    title: "Talleres",
    keywords: ["taller", "workshop", "convenio", "autorizado"],
    content: "Los talleres tienen convenio, CUIT/NIT, categorias permitidas, valor hora de mano de obra y monto maximo por factura. El motor verifica si pueden facturar el siniestro.",
  },
  {
    id: "polizas",
    title: "Clientes y polizas",
    keywords: ["cliente", "poliza", "cobertura", "asegurado", "placa", "vehiculo"],
    content: "Las polizas vinculan asegurado, vehiculo, placa, cobertura, deducible y limite. La auditoria valida vigencia, titular, placa, vehiculo y limite de reparacion.",
  },
  {
    id: "revision-humana",
    title: "Revision humana",
    keywords: ["revision", "humana", "auditor", "revisar", "primero", "prioridad"],
    content: "El auditor humano prioriza casos rejected, alertas criticas, facturas observed con riesgo alto, duplicados, diferencias contra siniestro y talleres con patrones repetidos.",
  },
];

const typoMap: Array<[RegExp, string]> = [
  [/\bfacrura?s?\b/g, "factura"],
  [/\bsinietro?s?\b/g, "siniestro"],
  [/\bfljo\b/g, "flujo"],
];

export function normalizeAgentMessage(message: string) {
  let normalized = normalizeText(message);
  for (const [pattern, replacement] of typoMap) normalized = normalized.replace(pattern, replacement);
  return normalized;
}

export function getRelevantContext(message: string, limit = 4) {
  const normalized = normalizeAgentMessage(message);
  const scored = contextBlocks
    .map((block) => {
      const score = block.keywords.reduce((total, keyword) => total + (normalized.includes(normalizeText(keyword)) ? 2 : 0), 0) + (normalized.includes(block.id) ? 1 : 0);
      return { block, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((item) => item.block);

  return (scored.length ? scored : contextBlocks.slice(0, 3)).slice(0, limit);
}
