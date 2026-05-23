import { NextResponse } from "next/server";
import { deleteWorkshop, listWorkshops, upsertWorkshop } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { WorkshopAgreement } from "@/types/policy";

export async function GET() {
  return NextResponse.json({ workshops: await listWorkshops() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<WorkshopAgreement>;
  const workshop: WorkshopAgreement = {
    id: body.id || uid("workshop"),
    workshopName: body.workshopName || "",
    taxId: body.taxId || "",
    insurerName: body.insurerName || "Seguros del Norte S.A.",
    status: body.status || "active",
    laborHourRate: Number(body.laborHourRate || 0),
    maxInvoiceAmount: Number(body.maxInvoiceAmount || 0),
    allowedCategories: body.allowedCategories || [],
  };
  return NextResponse.json({ workshop: await upsertWorkshop(workshop) });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Falta id." }, { status: 400 });
  await deleteWorkshop(id);
  return NextResponse.json({ ok: true });
}
