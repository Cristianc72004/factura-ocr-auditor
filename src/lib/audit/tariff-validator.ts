import type { AuditAlert } from "@/types/audit";
import type { InvoiceItem } from "@/types/invoice";
import type { TariffItem } from "@/types/tariff";
import { normalizeText, uid } from "../utils";

function findTariff(item: InvoiceItem, tariffs: TariffItem[]) {
  const itemText = normalizeText(item.description);
  return tariffs.find((tariff) => {
    const tariffText = normalizeText(tariff.description);
    return itemText.includes(tariffText) || tariffText.includes(itemText);
  });
}

export function validateTariffs(items: InvoiceItem[], tariffs: TariffItem[]): AuditAlert[] {
  const alerts: AuditAlert[] = [];

  for (const item of items) {
    const tariff = findTariff(item, tariffs);
    if (!tariff) {
      alerts.push({
        id: uid("alert"),
        severity: "medium",
        type: "missing_tariff",
        message: `No se encontró tarifario para ${item.description}.`,
        field: "description",
        actualValue: item.description,
      });
      continue;
    }
    if (!tariff.authorized) {
      alerts.push({
        id: uid("alert"),
        severity: "medium",
        type: "unauthorized_item",
        message: `${item.description} no está autorizado en el tarifario.`,
        field: "authorized",
        expectedValue: "true",
        actualValue: "false",
      });
    }
    if (item.unitPrice > tariff.maxUnitPrice) {
      alerts.push({
        id: uid("alert"),
        severity: "high",
        type: "tariff_price",
        message: `El precio de ${item.description} supera el tarifario acordado.`,
        field: "unitPrice",
        expectedValue: String(tariff.maxUnitPrice),
        actualValue: String(item.unitPrice),
      });
    }
    if (item.laborHours > tariff.maxLaborHours) {
      alerts.push({
        id: uid("alert"),
        severity: "medium",
        type: "labor_hours",
        message: `Las horas de mano de obra de ${item.description} superan el máximo permitido.`,
        field: "laborHours",
        expectedValue: String(tariff.maxLaborHours),
        actualValue: String(item.laborHours),
      });
    }
  }

  return alerts;
}
