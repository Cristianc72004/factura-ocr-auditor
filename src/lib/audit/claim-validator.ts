import type { AuditAlert } from "@/types/audit";
import type { Claim } from "@/types/claim";
import type { ExtractedInvoice } from "@/types/invoice";
import type { InsurancePolicy, WorkshopAgreement } from "@/types/policy";
import { normalizeText, uid } from "../utils";

function serviceAllowed(description: string, services: string[]) {
  const itemText = normalizeText(description);
  return services.map(normalizeText).some((service) => itemText.includes(service) || service.includes(itemText));
}

export function validateClaim(
  invoice: ExtractedInvoice,
  claims: Claim[],
  policies: InsurancePolicy[] = [],
  workshops: WorkshopAgreement[] = [],
): AuditAlert[] {
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
  const policy = policies.find((item) => item.policyNumber === claim.policyNumber);
  const workshop = workshops.find((item) => normalizeText(item.workshopName) === normalizeText(invoice.workshopName));

  if (!policy) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "missing_policy",
      message: `No se encontró la póliza ${claim.policyNumber} asociada al siniestro.`,
      field: "policyNumber",
      actualValue: claim.policyNumber,
    });
  } else {
    if (policy.status !== "active") {
      alerts.push({
        id: uid("alert"),
        severity: "critical",
        type: "inactive_policy",
        message: "La póliza del cliente no está activa.",
        field: "policyStatus",
        expectedValue: "active",
        actualValue: policy.status,
      });
    }
    if (normalizeText(policy.clientName) !== normalizeText(invoice.insuredName)) {
      alerts.push({
        id: uid("alert"),
        severity: "high",
        type: "insured_mismatch",
        message: "El asegurado de la factura no coincide con el titular de la póliza.",
        field: "insuredName",
        expectedValue: policy.clientName,
        actualValue: invoice.insuredName,
      });
    }
    if (invoice.total > policy.maxRepairAmount) {
      alerts.push({
        id: uid("alert"),
        severity: "high",
        type: "policy_limit_exceeded",
        message: "El total facturado supera el límite de reparación cubierto por la póliza.",
        field: "total",
        expectedValue: String(policy.maxRepairAmount),
        actualValue: String(invoice.total),
      });
    }
    for (const item of invoice.items) {
      if (!serviceAllowed(item.description, policy.coveredServices)) {
        alerts.push({
          id: uid("alert"),
          severity: "medium",
          type: "policy_coverage",
          message: `El ítem ${item.description} no está cubierto claramente por la póliza.`,
          field: "description",
          actualValue: item.description,
        });
      }
    }
  }

  if (!workshop) {
    alerts.push({
      id: uid("alert"),
      severity: "high",
      type: "missing_workshop_agreement",
      message: "El taller no tiene convenio registrado con la aseguradora.",
      field: "workshopName",
      actualValue: invoice.workshopName,
    });
  } else {
    if (workshop.status !== "active") {
      alerts.push({
        id: uid("alert"),
        severity: "critical",
        type: "inactive_workshop_agreement",
        message: "El convenio del taller no está activo.",
        field: "workshopStatus",
        expectedValue: "active",
        actualValue: workshop.status,
      });
    }
    if (invoice.total > workshop.maxInvoiceAmount) {
      alerts.push({
        id: uid("alert"),
        severity: "high",
        type: "workshop_limit_exceeded",
        message: "El total facturado supera el monto máximo del convenio del taller.",
        field: "total",
        expectedValue: String(workshop.maxInvoiceAmount),
        actualValue: String(invoice.total),
      });
    }
    for (const item of invoice.items) {
      if (!workshop.allowedCategories.includes(item.category)) {
        alerts.push({
          id: uid("alert"),
          severity: "medium",
          type: "workshop_category_not_allowed",
          message: `El convenio del taller no permite cobrar la categoría ${item.category}.`,
          field: "category",
          actualValue: item.category,
        });
      }
      if (item.category === "mano_obra" && item.unitPrice > workshop.laborHourRate) {
        alerts.push({
          id: uid("alert"),
          severity: "high",
          type: "workshop_labor_rate",
          message: "La hora de mano de obra supera la tarifa del convenio del taller.",
          field: "unitPrice",
          expectedValue: String(workshop.laborHourRate),
          actualValue: String(item.unitPrice),
        });
      }
    }
  }

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

  for (const item of invoice.items) {
    if (!serviceAllowed(item.description, claim.authorizedServices)) {
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
