import path from "node:path";
import { NextResponse } from "next/server";
import { recognizeInvoiceDocument } from "@/lib/ocr/invoice-recognizer";
import { parseInvoiceText } from "@/lib/ocr/parser";
import { extractDocxText, extractDocxTextFromBytes, extractPdfText, extractPdfTextFromBytes, getPdfFallbackText, runImageOcr } from "@/lib/ocr/tesseract";
import { readStoredFile } from "@/lib/storage";
import type { ExtractedInvoice } from "@/types/invoice";

type OcrRequest = {
  filePath?: string;
  storageKey?: string;
  url?: string;
  fileName?: string;
  originalName?: string;
  mimeType?: string;
  rawText?: string;
};

type GeneratedMetadata = {
  rawText?: string;
  invoice?: ExtractedInvoice;
};

async function readUploadedBytes(body: OcrRequest) {
  if (!body.storageKey && !body.url && !body.filePath) return null;
  return readStoredFile({ storageKey: body.storageKey, url: body.url, filePath: body.filePath });
}

function generatedMetaCandidates(body: OcrRequest) {
  const names = [body.originalName, body.fileName, body.storageKey ? path.basename(body.storageKey) : ""]
    .filter(Boolean)
    .map((value) => String(value));
  return Array.from(new Set(names.flatMap((name) => {
    const clean = path.basename(name);
    return [`generated/${clean}.json`, clean.endsWith(".json") ? `generated/${clean}` : ""].filter(Boolean);
  })));
}

async function readGeneratedMetadata(body: OcrRequest): Promise<GeneratedMetadata | null> {
  for (const storageKey of generatedMetaCandidates(body)) {
    try {
      const bytes = await readStoredFile({ storageKey });
      return JSON.parse(bytes.toString("utf8")) as GeneratedMetadata;
    } catch {
      // Try next candidate.
    }
  }
  return null;
}

function isWeakExtraction(rawText: string, invoice: ExtractedInvoice) {
  return rawText.trim().length < 80 || !invoice.invoiceNumber || !invoice.claimNumber || !invoice.items.length || invoice.total <= 0;
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
    const metadata = body.rawText ? null : await readGeneratedMetadata(body);
    if (metadata?.invoice && isWeakExtraction(rawText, invoice)) {
      const metadataText = metadata.rawText || rawText;
      const recognition = recognizeInvoiceDocument(metadataText);
      return NextResponse.json({
        rawText: metadataText,
        invoice: metadata.invoice,
        recognition,
        warning: "La extraccion PDF fue insuficiente; se usaron datos estructurados generados para rellenar el formulario.",
      });
    }

    const recognition = recognizeInvoiceDocument(rawText);
    return NextResponse.json({ rawText, invoice, recognition });
  } catch (error) {
    const metadata = body.rawText ? null : await readGeneratedMetadata(body);
    if (metadata?.invoice) {
      const rawText = metadata.rawText || getPdfFallbackText(body.fileName ?? "documento.pdf");
      const recognition = recognizeInvoiceDocument(rawText);
      return NextResponse.json({
        rawText,
        invoice: metadata.invoice,
        recognition,
        warning: "No se pudo extraer texto del PDF en este entorno; se usaron datos estructurados generados.",
      });
    }
    const rawText = body.mimeType === "application/pdf" ? getPdfFallbackText(body.fileName ?? "documento.pdf") : "";
    const recognition = recognizeInvoiceDocument(rawText);
    return NextResponse.json(
      {
        error: "No se pudo procesar OCR. Puede continuar ingresando los datos manualmente.",
        detail: error instanceof Error ? error.message : "Error desconocido",
        rawText,
        invoice: parseInvoiceText(rawText),
        recognition,
      },
      { status: 200 },
    );
  }
}
