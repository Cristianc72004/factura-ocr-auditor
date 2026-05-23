import { NextResponse } from "next/server";
import { listInvoices, updateInvoiceStatus } from "@/lib/db";
import type { InvoiceStatus } from "@/types/invoice";

export async function GET() {
  const invoices = await listInvoices();
  return NextResponse.json({ cases: invoices });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as {
    id: string;
    status: InvoiceStatus;
    reviewerName?: string;
    comment?: string;
  };
  const invoice = await updateInvoiceStatus(
    body.id,
    body.status,
    body.reviewerName || "Auditor humano",
    body.comment || "Cambio manual de estado.",
  );
  if (!invoice) {
    return NextResponse.json({ error: "Caso no encontrado." }, { status: 404 });
  }
  return NextResponse.json({ case: invoice });
}
