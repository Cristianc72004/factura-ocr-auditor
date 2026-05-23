import { NextResponse } from "next/server";
import { listTariffs, upsertTariff } from "@/lib/db";
import { uid } from "@/lib/utils";
import type { TariffItem } from "@/types/tariff";

export async function GET() {
  const tariffs = await listTariffs();
  return NextResponse.json({ tariffs });
}

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<TariffItem>;
  const tariff: TariffItem = {
    id: body.id || uid("tariff"),
    code: body.code || "NUEVO",
    description: body.description || "Nuevo concepto",
    category: body.category || "servicio",
    maxUnitPrice: Number(body.maxUnitPrice || 0),
    maxLaborHours: Number(body.maxLaborHours || 0),
    authorized: Boolean(body.authorized),
  };
  await upsertTariff(tariff);
  return NextResponse.json({ tariff });
}
