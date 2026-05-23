import { NextResponse } from "next/server";

export function GET() {
  return NextResponse.json({
    ok: true,
    service: "Auditor Agéntico de Facturación de Siniestros",
    timestamp: new Date().toISOString(),
  });
}
