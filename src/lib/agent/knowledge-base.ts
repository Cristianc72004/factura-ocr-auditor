export const knowledgeBase = {
  observada:
    "Una factura observada tiene alertas medias o altas que requieren revision humana antes de aprobar pago.",
  rechazada:
    "Una factura rechazada tiene riesgo alto, duplicado critico, poliza inactiva, convenio invalido o inconsistencias graves.",
  alerta_critica:
    "Una alerta critica bloquea el pago preventivamente porque puede implicar duplicado, fraude, poliza inactiva o convenio no valido.",
  tarifario:
    "El tarifario acordado define precio maximo, horas maximas y autorizacion para repuestos, materiales, mano de obra y servicios.",
  duplicado:
    "Un duplicado puede detectarse por UUID repetido, numero de factura repetido o misma combinacion taller-siniestro-total.",
  siniestro:
    "El siniestro reportado define accidente, vehiculo, placa, dano y servicios autorizados que la factura puede cobrar.",
  mano_obra:
    "La mano de obra fuera de rango ocurre cuando horas o precio por hora superan el convenio del taller o el tarifario.",
  riesgo:
    "El riesgo se calcula sumando alertas: critica 40, alta 25, media 15, baja 5. 0-30 aprueba, 31-70 observa, 71-100 rechaza.",
  reporte:
    "El reporte de auditoria resume estado, factura, siniestro, alertas, items, totales calculados y recomendacion.",
  motor:
    "El motor valida factura contra poliza, siniestro reportado, convenio del taller, tarifario, totales, UUID, duplicados e items autorizados.",
  generador:
    "El generador crea facturas PDF de prueba con el formato reconocido. Sirve para producir muestras, auditarlas y verificar reglas sin depender de documentos externos.",
};

export function explainRule(message: string) {
  const value = message.toLowerCase();
  if (value.includes("observ")) return knowledgeBase.observada;
  if (value.includes("rechaz")) return knowledgeBase.rechazada;
  if (value.includes("crit")) return knowledgeBase.alerta_critica;
  if (value.includes("tarif")) return knowledgeBase.tarifario;
  if (value.includes("duplic")) return knowledgeBase.duplicado;
  if (value.includes("siniestro")) return knowledgeBase.siniestro;
  if (value.includes("mano") || value.includes("hora")) return knowledgeBase.mano_obra;
  if (value.includes("riesgo") || value.includes("score")) return knowledgeBase.riesgo;
  if (value.includes("motor") || value.includes("valida")) return knowledgeBase.motor;
  if (value.includes("generar") || value.includes("pdf")) return knowledgeBase.generador;
  return knowledgeBase.reporte;
}
