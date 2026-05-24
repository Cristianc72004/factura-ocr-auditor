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
    "El reporte del siniestro lo aporta el cliente. Debe incluir numero de siniestro, numero de factura informada, poliza, asegurado, vehiculo, placa, dano reportado y servicios autorizados.",
  mano_obra:
    "La mano de obra fuera de rango ocurre cuando horas o precio por hora superan el convenio del taller o el tarifario.",
  riesgo:
    "El riesgo se calcula sumando alertas: critica 40, alta 25, media 15, baja 5. 0-30 aprueba, 31-70 observa, 71-100 rechaza.",
  reporte:
    "El reporte de auditoria resume estado, factura, siniestro, alertas, items, totales calculados y recomendacion.",
  motor:
    "El motor valida factura contra reporte del cliente, poliza, convenio del taller, tarifario, totales, UUID, duplicados e items autorizados. Tambien verifica si el dano reportado corresponde a los items cobrados.",
  flujo:
    "El flujo correcto es: cliente reporta siniestro con numero de factura, taller sube factura, OCR extrae datos, motor cruza reporte vs factura, valida tarifario y genera alertas para auditor.",
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
  if (value.includes("flujo") || value.includes("proceso")) return knowledgeBase.flujo;
  if (value.includes("mano") || value.includes("hora")) return knowledgeBase.mano_obra;
  if (value.includes("riesgo") || value.includes("score")) return knowledgeBase.riesgo;
  if (value.includes("motor") || value.includes("valida")) return knowledgeBase.motor;
  if (value.includes("generar") || value.includes("pdf")) return knowledgeBase.generador;
  return knowledgeBase.reporte;
}
