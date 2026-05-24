export const POLICY_STATUS_LABELS = {
  active: "Activa",
  expired: "Vencida",
  suspended: "Suspendida",
} as const;

export const CLAIM_STATUS_LABELS = {
  open: "Abierto",
  under_review: "En revisión",
  closed: "Cerrado",
} as const;

export const WORKSHOP_STATUS_LABELS = {
  active: "Activo",
  suspended: "Suspendido",
} as const;

export const PLAN_LABELS = {
  basica: "Básica",
  terceros_completo: "Terceros completo",
  todo_riesgo: "Todo riesgo",
} as const;

export const CATEGORY_LABELS: Record<string, string> = {
  repuesto: "Repuesto",
  material: "Material",
  mano_obra: "Mano de obra",
  servicio: "Servicio",
};

export const CATEGORY_OPTIONS = ["repuesto", "material", "mano_obra", "servicio"];

export const ALERT_TYPE_LABELS: Record<string, string> = {
  duplicate_uuid: "UUID duplicado",
  duplicate_invoice: "Factura duplicada",
  duplicate_invoice_number: "Número de factura duplicado",
  duplicate_invoice_context: "Posible factura duplicada",
  duplicate_fingerprint: "Coincidencia de taller, siniestro y total",
  duplicate_item: "Ítem duplicado",
  tax_mismatch: "Diferencia de IVA",
  total_mismatch: "Diferencia de total",
  subtotal_mismatch: "Diferencia de subtotal",
  tariff_price: "Precio sobre tarifario",
  tariff_labor_hours: "Horas sobre tarifario",
  labor_hours: "Horas sobre tarifario",
  missing_tariff: "Concepto sin tarifario",
  unauthorized_item: "Ítem no autorizado",
  missing_claim: "Siniestro no registrado",
  claim_invoice_mismatch: "Factura no coincide con siniestro",
  missing_policy: "Póliza no encontrada",
  inactive_policy: "Póliza inactiva",
  insured_mismatch: "Asegurado no coincide",
  policy_limit_exceeded: "Límite de póliza excedido",
  policy_coverage: "Cobertura no autorizada",
  missing_workshop_agreement: "Taller sin convenio",
  inactive_workshop_agreement: "Convenio de taller inactivo",
  workshop_limit_exceeded: "Límite de taller excedido",
  workshop_category_not_allowed: "Categoría no permitida",
  workshop_labor_rate: "Tarifa de mano de obra excedida",
  vehicle_mismatch: "Vehículo no coincide",
  plate_mismatch: "Placa no coincide",
  workshop_not_allowed: "Taller no autorizado",
  claim_scope: "Servicio fuera del alcance",
};

export function labelFromMap<T extends Record<string, string>>(map: T, value?: string) {
  if (!value) return "Sin dato";
  const normalized = value.trim().toLowerCase().replace(/\s+/g, "_").replace(/-/g, "_");
  return map[value] ?? map[normalized] ?? toTitleLabel(value);
}

function toTitleLabel(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}
