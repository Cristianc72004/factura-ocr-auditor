import { NextResponse } from "next/server";
import { deletePolicy, listPolicies, upsertPolicy } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { InsurancePolicy } from "@/types/policy";

export async function GET() {
  return NextResponse.json({ policies: await listPolicies() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<InsurancePolicy>;
  const policy: InsurancePolicy = {
    id: body.id || uid("policy"),
    policyNumber: body.policyNumber || "",
    insurerName: body.insurerName || "Seguros del Norte S.A.",
    clientName: body.clientName || "",
    clientDocument: body.clientDocument || "",
    vehicle: body.vehicle || "",
    licensePlate: body.licensePlate || "",
    plan: body.plan || "todo_riesgo",
    deductible: Number(body.deductible || 0),
    maxRepairAmount: Number(body.maxRepairAmount || 0),
    coveredServices: body.coveredServices || [],
    status: body.status || "active",
  };
  return NextResponse.json({ policy: await upsertPolicy(policy) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  await deletePolicy(id);
  return NextResponse.json({ ok: true });
}
