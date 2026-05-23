import { NextResponse } from "next/server";
import { auditInvoice } from "@/lib/audit/audit-engine";
import { listClaims, listInvoices, listTariffs, saveInvoice } from "@/lib/db";
import { recognizeInvoiceDocument } from "@/lib/ocr/invoice-recognizer";
import { uid } from "@/lib/utils";
import type { ExtractedInvoice, InvoiceRecord } from "@/types/invoice";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    invoice: ExtractedInvoice;
    rawOcrText?: string;
    fileName?: string;
    persist?: boolean;
  };

  const recognition = recognizeInvoiceDocument(body.rawOcrText ?? "");
  if (body.rawOcrText && !recognition.isValid) {
    return NextResponse.json({ error: recognition.message, recognition }, { status: 422 });
  }

  const previousInvoices = await listInvoices();
  const tariffs = await listTariffs();
  const report = auditInvoice(body.invoice, {
    previousInvoices,
    tariffs,
    claims: listClaims(),
  });

  if (body.persist ?? true) {
    const record: InvoiceRecord = {
      ...body.invoice,
      id: uid("inv"),
      status: report.status,
      riskScore: report.riskScore,
      rawOcrText: body.rawOcrText ?? "",
      createdAt: new Date().toISOString(),
      alerts: report.alerts,
      reviews: [],
      fileName: body.fileName,
    };
    await saveInvoice(record);
    return NextResponse.json({ report, case: record, recognition });
  }

  return NextResponse.json({ report, recognition });
}
