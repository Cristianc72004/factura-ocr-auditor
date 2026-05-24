import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "Auditor Agentico de Facturacion de Siniestros",
    timestamp: new Date().toISOString(),
  });
}
