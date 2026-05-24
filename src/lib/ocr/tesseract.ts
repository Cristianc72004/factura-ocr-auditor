import { readFile } from "node:fs/promises";
import { createWorker } from "tesseract.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

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
    "El prototipo acepta PDF, pero el OCR local se optimiza para PNG/JPG.",
    "Completa o corrige los campos manualmente antes de auditar.",
  ].join("\n");
}

export async function extractPdfText(filePath: string) {
  const data = await readFile(filePath);
  return extractPdfTextFromBytes(data);
}

export async function extractPdfTextFromBytes(data: Buffer) {
  const parser = new PDFParse({ data });
  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export async function extractDocxText(filePath: string) {
  const result = await mammoth.extractRawText({ path: filePath });
  return result.value;
}

export async function extractDocxTextFromBytes(data: Buffer) {
  const result = await mammoth.extractRawText({ buffer: data });
  return result.value;
}
