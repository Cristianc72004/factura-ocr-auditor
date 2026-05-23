export type InsurancePolicy = {
  id: string;
  policyNumber: string;
  insurerName: string;
  clientName: string;
  clientDocument: string;
  vehicle: string;
  licensePlate: string;
  plan: "basica" | "terceros_completo" | "todo_riesgo";
  deductible: number;
  maxRepairAmount: number;
  coveredServices: string[];
  status: "active" | "expired" | "suspended";
};

export type WorkshopAgreement = {
  id: string;
  workshopName: string;
  taxId: string;
  insurerName: string;
  status: "active" | "suspended";
  laborHourRate: number;
  maxInvoiceAmount: number;
  allowedCategories: string[];
};
