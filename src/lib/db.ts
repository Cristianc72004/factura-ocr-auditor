import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { AuditReview } from "@/types/audit";
import type { InvoiceRecord, InvoiceStatus } from "@/types/invoice";
import type { Claim } from "@/types/claim";
import type { InsurancePolicy, WorkshopAgreement } from "@/types/policy";
import type { TariffItem } from "@/types/tariff";
import { demoClaims, demoPolicies, demoTariffs, demoWorkshops } from "./mock-data";
import { uid } from "./utils";

const dataDir = path.join(process.cwd(), ".local-data");
const invoicesPath = path.join(dataDir, "invoices.json");
const tariffsPath = path.join(dataDir, "tariffs.json");
const claimsPath = path.join(dataDir, "claims.json");
const policiesPath = path.join(dataDir, "policies.json");
const workshopsPath = path.join(dataDir, "workshops.json");

async function ensureStore() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(invoicesPath, "utf8");
  } catch {
    await writeFile(invoicesPath, JSON.stringify([], null, 2));
  }
  try {
    await readFile(tariffsPath, "utf8");
  } catch {
    await writeFile(tariffsPath, JSON.stringify(demoTariffs, null, 2));
  }
  try {
    await readFile(claimsPath, "utf8");
  } catch {
    await writeFile(claimsPath, JSON.stringify(demoClaims, null, 2));
  }
  try {
    await readFile(policiesPath, "utf8");
  } catch {
    await writeFile(policiesPath, JSON.stringify(demoPolicies, null, 2));
  }
  try {
    await readFile(workshopsPath, "utf8");
  } catch {
    await writeFile(workshopsPath, JSON.stringify(demoWorkshops, null, 2));
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

export async function deleteTariff(id: string) {
  const tariffs = await listTariffs();
  await writeFile(tariffsPath, JSON.stringify(tariffs.filter((item) => item.id !== id), null, 2));
}

export async function listClaims(): Promise<Claim[]> {
  await ensureStore();
  const content = await readFile(claimsPath, "utf8");
  return JSON.parse(content) as Claim[];
}

export async function upsertClaim(claim: Claim) {
  const claims = await listClaims();
  const next = [claim, ...claims.filter((item) => item.id !== claim.id)];
  await writeFile(claimsPath, JSON.stringify(next, null, 2));
  return claim;
}

export async function deleteClaim(id: string) {
  const claims = await listClaims();
  await writeFile(claimsPath, JSON.stringify(claims.filter((item) => item.id !== id), null, 2));
}

export async function listPolicies(): Promise<InsurancePolicy[]> {
  await ensureStore();
  const content = await readFile(policiesPath, "utf8");
  return JSON.parse(content) as InsurancePolicy[];
}

export async function upsertPolicy(policy: InsurancePolicy) {
  const policies = await listPolicies();
  const next = [policy, ...policies.filter((item) => item.id !== policy.id)];
  await writeFile(policiesPath, JSON.stringify(next, null, 2));
  return policy;
}

export async function deletePolicy(id: string) {
  const policies = await listPolicies();
  await writeFile(policiesPath, JSON.stringify(policies.filter((item) => item.id !== id), null, 2));
}

export async function listWorkshops(): Promise<WorkshopAgreement[]> {
  await ensureStore();
  const content = await readFile(workshopsPath, "utf8");
  return JSON.parse(content) as WorkshopAgreement[];
}

export async function upsertWorkshop(workshop: WorkshopAgreement) {
  const workshops = await listWorkshops();
  const next = [workshop, ...workshops.filter((item) => item.id !== workshop.id)];
  await writeFile(workshopsPath, JSON.stringify(next, null, 2));
  return workshop;
}

export async function deleteWorkshop(id: string) {
  const workshops = await listWorkshops();
  await writeFile(workshopsPath, JSON.stringify(workshops.filter((item) => item.id !== id), null, 2));
}
