export type InvoiceStatus = "approved" | "observed" | "rejected";

export type InvoiceItem = {
  id?: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  laborHours: number;
  total: number;
};

export type ExtractedInvoice = {
  invoiceNumber: string;
  claimNumber: string;
  workshopName: string;
  insuredName: string;
  vehicle: string;
  licensePlate: string;
  date: string;
  uuid: string;
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
