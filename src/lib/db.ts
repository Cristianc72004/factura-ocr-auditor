import type { AuditReview } from "@/types/audit";
import type { Claim } from "@/types/claim";
import type { InvoiceRecord, InvoiceStatus } from "@/types/invoice";
import type { InsurancePolicy, WorkshopAgreement } from "@/types/policy";
import type { TariffItem } from "@/types/tariff";
import { demoClaims, demoPolicies, demoTariffs, demoWorkshops, initialDemoInvoices } from "./mock-data";
import { readJsonStore, writeJsonStore } from "./storage";
import { uid } from "./utils";

const stores = {
  invoices: "data/invoices.json",
  tariffs: "data/tariffs.json",
  claims: "data/claims.json",
  policies: "data/policies.json",
  workshops: "data/workshops.json",
};

async function readList<T>(key: string, seed: T[], useSeedWhenEmpty = false) {
  const value = await readJsonStore<T[]>(key, seed);
  if (useSeedWhenEmpty && value.length === 0 && seed.length > 0) {
    await writeJsonStore(key, seed);
    return seed;
  }
  return value;
}

async function writeList<T>(key: string, value: T[]) {
  await writeJsonStore(key, value);
}

export async function listInvoices(): Promise<InvoiceRecord[]> {
  return readList<InvoiceRecord>(stores.invoices, initialDemoInvoices, true);
}

export async function getInvoice(id: string) {
  const invoices = await listInvoices();
  return invoices.find((invoice) => invoice.id === id) ?? null;
}

export async function saveInvoice(invoice: InvoiceRecord) {
  const invoices = await listInvoices();
  const next = [invoice, ...invoices.filter((item) => item.id !== invoice.id)];
  await writeList(stores.invoices, next);
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
  await writeList(stores.invoices, invoices);
  return invoice;
}

export async function listTariffs(): Promise<TariffItem[]> {
  return readList<TariffItem>(stores.tariffs, demoTariffs, true);
}

export async function upsertTariff(tariff: TariffItem) {
  const tariffs = await listTariffs();
  const next = [tariff, ...tariffs.filter((item) => item.id !== tariff.id)];
  await writeList(stores.tariffs, next);
  return tariff;
}

export async function deleteTariff(id: string) {
  const tariffs = await listTariffs();
  await writeList(stores.tariffs, tariffs.filter((item) => item.id !== id));
}

export async function listClaims(): Promise<Claim[]> {
  return readList<Claim>(stores.claims, demoClaims, true);
}

export async function upsertClaim(claim: Claim) {
  const claims = await listClaims();
  const next = [claim, ...claims.filter((item) => item.id !== claim.id)];
  await writeList(stores.claims, next);
  return claim;
}

export async function deleteClaim(id: string) {
  const claims = await listClaims();
  await writeList(stores.claims, claims.filter((item) => item.id !== id));
}

export async function listPolicies(): Promise<InsurancePolicy[]> {
  return readList<InsurancePolicy>(stores.policies, demoPolicies, true);
}

export async function upsertPolicy(policy: InsurancePolicy) {
  const policies = await listPolicies();
  const next = [policy, ...policies.filter((item) => item.id !== policy.id)];
  await writeList(stores.policies, next);
  return policy;
}

export async function deletePolicy(id: string) {
  const policies = await listPolicies();
  await writeList(stores.policies, policies.filter((item) => item.id !== id));
}

export async function listWorkshops(): Promise<WorkshopAgreement[]> {
  return readList<WorkshopAgreement>(stores.workshops, demoWorkshops, true);
}

export async function upsertWorkshop(workshop: WorkshopAgreement) {
  const workshops = await listWorkshops();
  const next = [workshop, ...workshops.filter((item) => item.id !== workshop.id)];
  await writeList(stores.workshops, next);
  return workshop;
}

export async function deleteWorkshop(id: string) {
  const workshops = await listWorkshops();
  await writeList(stores.workshops, workshops.filter((item) => item.id !== id));
}
