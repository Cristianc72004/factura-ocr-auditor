import path from "node:path";
import { NextResponse } from "next/server";
import { recognizeInvoiceDocument } from "@/lib/ocr/invoice-recognizer";
import { parseInvoiceText } from "@/lib/ocr/parser";
import { extractDocxText, extractDocxTextFromBytes, extractPdfText, extractPdfTextFromBytes, getPdfFallbackText, runImageOcr } from "@/lib/ocr/tesseract";
import { readStoredFile } from "@/lib/storage";

type OcrRequest = {
  filePath?: string;
  storageKey?: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  rawText?: string;
};

async function readUploadedBytes(body: OcrRequest) {
  if (!body.storageKey && !body.url && !body.filePath) return null;
  return readStoredFile({ storageKey: body.storageKey, url: body.url, filePath: body.filePath });
}

export async function POST(request: Request) {
  const body = (await request.json()) as OcrRequest;

  try {
    const bytes = body.rawText ? null : await readUploadedBytes(body);
    const rawText = body.rawText
      ? body.rawText
      : body.mimeType === "application/pdf"
        ? bytes
          ? await extractPdfTextFromBytes(bytes)
          : body.filePath
            ? await extractPdfText(path.resolve(body.filePath))
            : getPdfFallbackText(body.fileName ?? "documento.pdf")
      : body.mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ? bytes
          ? await extractDocxTextFromBytes(bytes)
          : body.filePath
            ? await extractDocxText(path.resolve(body.filePath))
            : ""
      : bytes
        ? await runImageOcr(bytes)
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
