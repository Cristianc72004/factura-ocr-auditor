import claims from "@/data/claims.json";
import tariffs from "@/data/tariffs.json";
import demoInvoices from "@/data/demo-invoices.json";
import type { Claim } from "@/types/claim";
import type { InvoiceRecord } from "@/types/invoice";
import type { TariffItem } from "@/types/tariff";

export const demoClaims = claims as Claim[];
export const demoTariffs = tariffs as TariffItem[];
export const initialDemoInvoices = demoInvoices as InvoiceRecord[];
