import { readFile } from "node:fs/promises";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";

export async function runImageOcr(input: string | Buffer) {
  const worker = await createWorker("spa+eng");
  try {
    const result = await worker.recognize(input as never);
    return result.data.text;
  } finally {
    await worker.terminate();
  }
}

export function getPdfFallbackText(fileName: string) {
  return [
    `Documento PDF recibido: ${fileName}`,
    "LECTURA_PDF_FALLIDA",
    "El texto del PDF no pudo extraerse en este entorno.",
    "Revisa el diagnostico OCR o completa los campos manualmente antes de auditar.",
  ].join("\n");
}

export async function extractPdfText(filePath: string) {
  const data = await readFile(filePath);
  return extractPdfTextFromBytes(data);
}

export async function extractPdfTextFromBytes(data: Buffer) {
  const attempts: string[] = [];
  const { PDFParse } = await import("pdf-parse");
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    const text = result.text || "";
    attempts.push(`pdf-parse:${text.length}`);
    if (text.trim().length >= 80) return text;
  } finally {
    await parser.destroy();
  }

  try {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(data),
      disableWorker: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      disableFontFace: true,
    } as never);
    const document = await loadingTask.promise;
    const pages: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item: unknown) => {
          if (typeof item === "object" && item && "str" in item) return String((item as { str: string }).str);
          return "";
        })
        .filter(Boolean)
        .join("\n");
      pages.push(pageText);
    }
    const text = pages.join("\n");
    attempts.push(`pdfjs:${text.length}`);
    if (text.trim()) return text;
  } catch (error) {
    attempts.push(`pdfjs-error:${error instanceof Error ? error.message : "unknown"}`);
  }

  console.warn("[ocr:pdf] weak extraction", attempts.join(" | "));
  return "";
}

export async function extractDocxText(filePath: string) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function extractDocxTextFromBytes(data: Buffer) {
  const result = await mammoth.extractRawText({ buffer: data });
  return result.value;
}
