import type { AgentIntent } from "./agent-types";

export function detectIntent(message: string): AgentIntent {
  const text = message.toLowerCase();
  if (/hola|buenas|saludos/.test(text)) return "saludo";
  if (/ayuda|puedes hacer|que sabes|como usar|como auditar|paso a paso|explicame.*pagina|flujo completo|ejemplo/.test(text)) return "ayuda";
  if (/estado del dia|resumen general|dashboard|metric|situacion|panorama|base para auditar/.test(text)) return "consulta_dashboard";
  if (/(casos?|facturas?)\s+(criticos?|criticas?)|criticos?|criticas?/.test(text) && /ver|listar|mostrar|cuales|cuantas|alertas?|casos?|facturas?/.test(text)) return "listar_alertas";
  if (/prior|primero|hoy|urgente|auditar luego/.test(text)) return "priorizar_revision";
  if (/taller|rechazos por taller|alertas por taller/.test(text)) return "analizar_taller";
  if (/criticas?|criticos?|alertas?/.test(text) && /listar|ver|mostrar|cuales|cuantas/.test(text)) return "listar_alertas";
  if (/duplic/.test(text)) return "detectar_duplicado";
  if (/tarif/.test(text) || /precio|fuera de rango/.test(text)) return "comparar_tarifario";
  if (/regla|por que regla|clasifica|riesgo|que valida|motor|generar facturas/.test(text)) return "explicar_regla";
  if (/recomienda|recomendacion|deberia/.test(text)) return "recomendacion_auditor";
  if (/factura\s*\d|0001-|buscar factura|que paso con/.test(text)) return "buscar_factura";
  if (/siniestro\s*\d|buscar siniestro|resume el caso del siniestro/.test(text)) return "buscar_siniestro";
  if (/por que|observada|rechazada|explica/.test(text)) return "explicar_alerta";
  if (/resume|resumen|esta factura|este caso|caso/.test(text)) return "resumen_caso";
  if (/^y |^que |^cual |^cuanto |^la |^el /.test(text)) return "seguimiento_contextual";
  return "desconocido";
}
