import path from "node:path";
import { NextResponse } from "next/server";
import { recognizeInvoiceDocument } from "@/lib/ocr/invoice-recognizer";
import { parseInvoiceText } from "@/lib/ocr/parser";
import { extractDocxText, extractPdfText, getPdfFallbackText, runImageOcr } from "@/lib/ocr/tesseract";

export async function POST(request: Request) {
  const body = (await request.json()) as { filePath?: string; fileName?: string; mimeType?: string; rawText?: string };

  try {
    const rawText = body.rawText
      ? body.rawText
      : body.mimeType === "application/pdf"
        ? body.filePath
          ? await extractPdfText(path.resolve(body.filePath))
          : getPdfFallbackText(body.fileName ?? "documento.pdf")
        : body.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" && body.filePath
          ? await extractDocxText(path.resolve(body.filePath))
        : body.filePath
          ? await runImageOcr(path.resolve(body.filePath))
          : "";

    const invoice = parseInvoiceText(rawText);
    const recognition = recognizeInvoiceDocument(rawText);
    return NextResponse.json({ rawText, invoice, recognition });
  } catch (error) {
    const recognition = recognizeInvoiceDocument("");
    return NextResponse.json(
      {
        error: "No se pudo procesar OCR. Puede continuar ingresando los datos manualmente.",
        detail: error instanceof Error ? error.message : "Error desconocido",
        rawText: "",
        invoice: parseInvoiceText(""),
        recognition,
      },
      { status: 200 },
    );
  }
}
