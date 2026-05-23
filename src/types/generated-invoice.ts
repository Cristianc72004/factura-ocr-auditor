export type GeneratedInvoiceRequest = {
  count: number;
  workshopName?: string;
  customerName?: string;
  baseClaimNumber?: string;
  baseInvoiceNumber?: number;
  includeOptionalSignals?: boolean;
};

export type GeneratedInvoiceFile = {
  fileName: string;
  downloadUrl: string;
  filePath: string;
  invoiceNumber: string;
  claimNumber: string;
  total: number;
};
