import { NextResponse } from "next/server";
import { generateDigitFlowInvoices } from "@/lib/invoice-generator";
import type { GeneratedInvoiceRequest } from "@/types/generated-invoice";

export async function POST(request: Request) {
  const body = (await request.json()) as Partial<GeneratedInvoiceRequest>;
  const files = await generateDigitFlowInvoices({
    count: 1,
    claimNumber: body.claimNumber,
    workshopName: body.workshopName,
    customerName: body.customerName,
    baseClaimNumber: body.baseClaimNumber,
    baseInvoiceNumber: Number(body.baseInvoiceNumber || 1234),
    includeOptionalSignals: body.includeOptionalSignals ?? true,
  });

  return NextResponse.json({ files });
}
