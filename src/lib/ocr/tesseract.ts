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
    "DigitFlow Solutions S.A.S.",
    "FACTURA ELECTRONICA",
    `Documento PDF recibido: ${fileName}`,
    "DATOS DEL SINIESTRO",
    "N Siniestro: pendiente",
    "ITEM CODIGO DESCRIPCION CANT. UNID. P. UNITARIO DESC. IMPORTE",
    "1 RV-DIG-0001 Item pendiente de lectura PDF 1,00 u 0,00 0,00 0,00",
    "SUBTOTAL: 0,00",
    "IVA (21%): 0,00",
    "TOTAL ARS: 0,00",
    "UUID: pendiente",
    "CAE: pendiente",
    "Autorizado por AFIP",
    "El texto del PDF no pudo extraerse en este entorno. Revisa o completa los campos antes de auditar.",
  ].join("\n");
}

export async function extractPdfText(filePath: string) {
  const data = await readFile(filePath);
  return extractPdfTextFromBytes(data);
}

export async function extractPdfTextFromBytes(data: Buffer) {
  const { PDFParse } = await import("pdf-parse");
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
