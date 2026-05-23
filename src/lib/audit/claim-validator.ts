import type { AuditAlert } from "@/types/audit";
import type { Claim } from "@/types/claim";
import type { ExtractedInvoice } from "@/types/invoice";
import { normalizeText, uid } from "../utils";

export function validateClaim(invoice: ExtractedInvoice, claims: Claim[]): AuditAlert[] {
  const claim = claims.find((item) => item.claimNumber === invoice.claimNumber);
  if (!claim) {
    return [
      {
        id: uid("alert"),
        severity: "high",
        type: "missing_claim",
        message: `El siniestro ${invoice.claimNumber || "sin número"} no existe en la base de siniestros.`,
        field: "claimNumber",
        actualValue: invoice.claimNumber,
      },
    ];
  }

  const alerts: AuditAlert[] = [];
  if (normalizeText(claim.vehicle) !== normalizeText(invoice.vehicle)) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "vehicle_mismatch",
      message: "El vehículo de la factura no coincide con el siniestro reportado.",
      field: "vehicle",
      expectedValue: claim.vehicle,
      actualValue: invoice.vehicle,
    });
  }
  if (normalizeText(claim.licensePlate) !== normalizeText(invoice.licensePlate)) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "plate_mismatch",
      message: "La patente/placa de la factura no coincide con el siniestro.",
      field: "licensePlate",
      expectedValue: claim.licensePlate,
      actualValue: invoice.licensePlate,
    });
  }
  if (!claim.authorizedWorkshopNames.map(normalizeText).includes(normalizeText(invoice.workshopName))) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "workshop_not_allowed",
      message: "El taller no está autorizado para este siniestro.",
      field: "workshopName",
      expectedValue: claim.authorizedWorkshopNames.join(", "),
      actualValue: invoice.workshopName,
    });
  }

  const authorized = claim.authorizedServices.map(normalizeText);
  for (const item of invoice.items) {
    const itemText = normalizeText(item.description);
    const allowed = authorized.some((service) => itemText.includes(service) || service.includes(itemText));
    if (!allowed) {
      alerts.push({
        id: uid("alert"),
        severity: "high",
        type: "claim_scope",
        message: `El servicio ${item.description} no corresponde a los servicios autorizados del siniestro.`,
        field: "description",
        actualValue: item.description,
      });
    }
  }

  return alerts;
}
