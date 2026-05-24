import { NextResponse } from "next/server";
import { deleteClaim, listClaims, upsertClaim } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { Claim } from "@/types/claim";

export async function GET() {
  return NextResponse.json({ claims: await listClaims() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<Claim>;
  const claim: Claim = {
    id: body.id || uid("claim"),
    claimNumber: body.claimNumber || "",
    invoiceNumber: body.invoiceNumber || "",
    policyNumber: body.policyNumber || "",
    insurerName: body.insurerName || "Seguros del Norte S.A.",
    insuredName: body.insuredName || "",
    vehicle: body.vehicle || "",
    licensePlate: body.licensePlate || "",
    accidentDate: body.accidentDate || new Date().toISOString().slice(0, 10),
    reportedDamage: body.reportedDamage || "",
    authorizedServices: body.authorizedServices || [],
    authorizedWorkshopNames: body.authorizedWorkshopNames || [],
    estimatedRepairAmount: Number(body.estimatedRepairAmount || 0),
    status: body.status || "open",
  };
  return NextResponse.json({ claim: await upsertClaim(claim) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  await deleteClaim(id);
  return NextResponse.json({ ok: true });
}
