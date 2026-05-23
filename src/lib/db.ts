import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditReview } from "@/types/audit";
import type { InvoiceRecord, InvoiceStatus } from "@/types/invoice";
import type { TariffItem } from "@/types/tariff";
import { demoClaims, demoTariffs, initialDemoInvoices } from "./mock-data";
import { uid } from "./utils";

const dataDir = path.join(process.cwd(), ".local-data");
const invoicesPath = path.join(dataDir, "invoices.json");
const tariffsPath = path.join(dataDir, "tariffs.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(invoicesPath, "utf8");
  } catch {
    await writeFile(invoicesPath, JSON.stringify(initialDemoInvoices, null, 2));
  }
  try {
    await readFile(tariffsPath, "utf8");
  } catch {
    await writeFile(tariffsPath, JSON.stringify(demoTariffs, null, 2));
  }
}

export async function listInvoices(): Promise<InvoiceRecord[]> {
  await ensureStore();
  const content = await readFile(invoicesPath, "utf8");
  return JSON.parse(content) as InvoiceRecord[];
}

export async function getInvoice(id: string) {
  const invoices = await listInvoices();
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function saveInvoice(invoice: InvoiceRecord) {
  const invoices = await listInvoices();
  const next = [invoice, ...invoices.filter((item) => item.id !== invoice.id)];
  await writeFile(invoicesPath, JSON.stringify(next, null, 2));
  return invoice;
}

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus,
  reviewerName: string,
  comment: string,
) {
  const invoices = await listInvoices();
  const invoice = invoices.find((item) => item.id === id);
  if (!invoice) return null;
  const review: AuditReview = {
    id: uid("review"),
    reviewerName,
    decision: status,
    comment,
    reviewedAt: new Date().toISOString(),
  };
  invoice.status = status;
  invoice.reviews = [review, ...(invoice.reviews ?? [])];
  await writeFile(invoicesPath, JSON.stringify(invoices, null, 2));
  return invoice;
}

export async function listTariffs(): Promise<TariffItem[]> {
  await ensureStore();
  const content = await readFile(tariffsPath, "utf8");
  return JSON.parse(content) as TariffItem[];
}

export async function upsertTariff(tariff: TariffItem) {
  const tariffs = await listTariffs();
  const next = [tariff, ...tariffs.filter((item) => item.id !== tariff.id)];
  await writeFile(tariffsPath, JSON.stringify(next, null, 2));
  return tariff;
}

export function listClaims() {
  return demoClaims;
}
