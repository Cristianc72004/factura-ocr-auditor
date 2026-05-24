export type InvoiceStatus = "approved" | "observed" | "rejected";

export type InvoiceItem = {
  id?: string;
  code?: string;
  description: string;
  category: string;
  quantity: number;
  unit?: string;
  unitPrice: number;
  discount?: number;
  laborHours: number;
  total: number;
};

export type ExtractedInvoice = {
  invoiceNumber: string;
  claimNumber: string;
  policyNumber?: string;
  workshopName: string;
  workshopTaxId?: string;
  customerName?: string;
  customerTaxId?: string;
  insuredName: string;
  vehicle: string;
  licensePlate: string;
  date: string;
  currency?: string;
  cae?: string;
  uuid: string;
  fiscalUrl?: string;
  observations?: string;
  subtotal: number;
  tax: number;
  total: number;
  items: InvoiceItem[];
};

export type InvoiceRecord = ExtractedInvoice & {
  id: string;
  status: InvoiceStatus;
  riskScore: number;
  rawOcrText: string;
  createdAt: string;
  alerts: import("./audit").AuditAlert[];
  reviews: import("./audit").AuditReview[];
  fileName?: string;
};
