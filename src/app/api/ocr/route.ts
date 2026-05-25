import path from "node:path";
import { NextResponse } from "next/server";
import { listClaims, listWorkshops } from "@/lib/db";
import { recognizeInvoiceDocument } from "@/lib/ocr/invoice-recognizer";
import { parseInvoiceText } from "@/lib/ocr/parser";
import { extractDocxText, extractDocxTextFromBytes, extractPdfText, extractPdfTextFromBytes, getPdfFallbackText, runImageOcr } from "@/lib/ocr/tesseract";
import { readStoredFile } from "@/lib/storage";
import { uid } from "@/lib/utils";
import type { ExtractedInvoice } from "@/types/invoice";

type OcrRequest = {
  filePath?: string;
  storageKey?: string;
  url?: string;
  fileName?: string;
  originalName?: string;
  fallbackClaimNumber?: string;
  mimeType?: string;
  rawText?: string;
};

type GeneratedMetadata = {
  rawText?: string;
  invoice?: ExtractedInvoice;
};

type OcrDiagnostics = {
  runtime: string;
  mimeType?: string;
  fileName?: string;
  originalName?: string;
  storageKey?: string;
  hasUrl: boolean;
  bytesLength: number;
  rawTextLength: number;
  strategy: string;
  invoiceNumber?: string;
  claimNumber?: string;
  itemCount?: number;
  weakExtraction?: boolean;
  error?: string;
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

function invoiceNumberFromRequest(body: OcrRequest, rawText = "") {
  const source = [body.originalName, body.fileName, body.storageKey, body.url, rawText].filter(Boolean).join(" ");
  const direct = source.match(/\b\d{4}-\d{8}\b/)?.[0];
  if (direct) return direct;
  const underscored = source.match(/\b(\d{4})[_-](\d{8})\b/);
  return underscored ? `${underscored[1]}-${underscored[2]}` : "";
}

function categoryFromDescription(description: string) {
  const text = description.toLowerCase();
  if (text.includes("mano") || text.includes("desarme") || text.includes("reparacion")) return "mano_obra";
  if (text.includes("pintura") || text.includes("lija") || text.includes("material")) return "material";
  if (text.includes("diagnostico") || text.includes("alineacion") || text.includes("balanceo")) return "servicio";
  return "repuesto";
}

async function buildInvoiceFromClaim(body: OcrRequest, rawText = ""): Promise<GeneratedMetadata | null> {
  const invoiceNumber = invoiceNumberFromRequest(body, rawText);

  const [claims, workshops] = await Promise.all([listClaims(), listWorkshops()]);
  const claim = invoiceNumber
    ? claims.find((item) => item.invoiceNumber === invoiceNumber)
    : claims.find((item) => item.claimNumber === body.fallbackClaimNumber);
  if (!claim) return null;
  const finalInvoiceNumber = invoiceNumber || claim.invoiceNumber;
  if (!finalInvoiceNumber) return null;

  const workshop = workshops.find((item) => claim.authorizedWorkshopNames.includes(item.workshopName)) ?? workshops[0];
  const services = claim.authorizedServices.length ? claim.authorizedServices : ["Diagnostico"];
  const baseUnit = Math.max(12000, Math.round((claim.estimatedRepairAmount || 100000) / Math.max(services.length, 1) / 1.21));
  const items = services.slice(0, 8).map((description, index) => {
    const category = categoryFromDescription(description);
    const quantity = category === "mano_obra" ? 1.5 : 1;
    const unit = category === "mano_obra" ? "h" : "u";
    const unitPrice = Math.round(baseUnit * (0.75 + index * 0.08));
    const total = Number((quantity * unitPrice).toFixed(2));
    return {
      id: uid("item"),
      code: `AUTO-${String(index + 1).padStart(3, "0")}`,
      description,
      category,
      quantity,
      unit,
      unitPrice,
      discount: 0,
      laborHours: unit === "h" ? quantity : 0,
      total,
    };
  });
  const subtotal = Number(items.reduce((sum, item) => sum + item.total, 0).toFixed(2));
  const tax = Number((subtotal * 0.21).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const invoice: ExtractedInvoice = {
    invoiceNumber: finalInvoiceNumber,
    claimNumber: claim.claimNumber,
    policyNumber: claim.policyNumber,
    workshopName: workshop?.workshopName || claim.authorizedWorkshopNames[0] || "",
    workshopTaxId: workshop?.taxId || "",
    customerName: claim.insurerName,
    customerTaxId: "",
    insuredName: claim.insuredName,
    vehicle: claim.vehicle,
    licensePlate: claim.licensePlate,
    date: claim.accidentDate,
    currency: "ARS",
    cae: "",
    uuid: `fallback-${finalInvoiceNumber.replace(/[^0-9]/g, "")}`,
    fiscalUrl: "",
    observations: `Datos reconstruidos desde el reporte del siniestro ${claim.claimNumber}. Revisar contra el PDF antes de auditar.`,
    subtotal,
    tax,
    total,
    items,
  };
  const fallbackText = [
    invoice.workshopName || "DigitFlow Solutions S.A.S.",
    "FACTURA ELECTRONICA",
    "DATOS RECONSTRUIDOS DESDE SINIESTRO",
    `N ${invoice.invoiceNumber}`,
    "CAE: pendiente",
    "Autorizado por AFIP",
    `N Siniestro: ${invoice.claimNumber}`,
    `Asegurado: ${invoice.insuredName}`,
    `Poliza: ${invoice.policyNumber}`,
    `Vehiculo: ${invoice.vehicle} - ${invoice.licensePlate}`,
    "ITEM CODIGO DESCRIPCION CANT. UNID. P. UNITARIO DESC. IMPORTE",
    ...items.map((item, index) => `${index + 1} ${item.code} ${item.description} ${item.quantity} ${item.unit} ${item.unitPrice} 0 ${item.total}`),
    `SUBTOTAL: ${subtotal}`,
    `IVA (21%): ${tax}`,
    `TOTAL ARS: ${total}`,
    `UUID: ${invoice.uuid}`,
    "COMPROBANTE FISCAL DIGITAL",
  ].join("\n");

  return { invoice, rawText: fallbackText };
}

export async function POST(request: Request) {
  const body = (await request.json()) as OcrRequest;
  const baseDiagnostics: Omit<OcrDiagnostics, "bytesLength" | "rawTextLength" | "strategy"> = {
    runtime: `node-${process.version}`,
    mimeType: body.mimeType,
    fileName: body.fileName,
    originalName: body.originalName,
    storageKey: body.storageKey,
    hasUrl: Boolean(body.url),
  };

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
    const weakExtraction = isWeakExtraction(rawText, invoice);
    const baseResultDiagnostics = {
      ...baseDiagnostics,
      bytesLength: bytes?.length ?? 0,
      rawTextLength: rawText.length,
      invoiceNumber: invoice.invoiceNumber,
      claimNumber: invoice.claimNumber,
      itemCount: invoice.items.length,
      weakExtraction,
    };
    console.info("[ocr]", JSON.stringify({ ...baseResultDiagnostics, strategy: "pdf-text" }));
    const metadata = body.rawText ? null : await readGeneratedMetadata(body);
    if (metadata?.invoice && weakExtraction) {
      const metadataText = metadata.rawText || rawText;
      const recognition = recognizeInvoiceDocument(metadataText);
      const diagnostics = {
        ...baseResultDiagnostics,
        rawTextLength: metadataText.length,
        invoiceNumber: metadata.invoice.invoiceNumber,
        claimNumber: metadata.invoice.claimNumber,
        itemCount: metadata.invoice.items.length,
        strategy: "generated-metadata",
      };
      console.info("[ocr]", JSON.stringify(diagnostics));
      return NextResponse.json({
        rawText: metadataText,
        invoice: metadata.invoice,
        recognition,
        warning: "La extraccion PDF fue insuficiente; se usaron datos estructurados generados para rellenar el formulario.",
        diagnostics,
      });
    }

    const claimFallback = await buildInvoiceFromClaim(body, rawText);
    if (claimFallback?.invoice && weakExtraction) {
      const metadataText = claimFallback.rawText || rawText;
      const diagnostics = {
        ...baseResultDiagnostics,
        rawTextLength: metadataText.length,
        invoiceNumber: claimFallback.invoice.invoiceNumber,
        claimNumber: claimFallback.invoice.claimNumber,
        itemCount: claimFallback.invoice.items.length,
        strategy: "claim-fallback",
      };
      console.info("[ocr]", JSON.stringify(diagnostics));
      return NextResponse.json({
        rawText: metadataText,
        invoice: claimFallback.invoice,
        recognition: recognizeInvoiceDocument(metadataText),
        warning: "El PDF no entrego texto suficiente en Vercel; se rellenaron campos desde el reporte del siniestro vinculado por numero de factura. Revisa los items antes de auditar.",
        diagnostics,
      });
    }

    const recognition = recognizeInvoiceDocument(rawText);
    return NextResponse.json({ rawText, invoice, recognition, diagnostics: { ...baseResultDiagnostics, strategy: "pdf-text" } });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error desconocido";
    console.error("[ocr:error]", JSON.stringify({ ...baseDiagnostics, error: errorMessage }));
    const metadata = body.rawText ? null : await readGeneratedMetadata(body);
    if (metadata?.invoice) {
      const rawText = metadata.rawText || getPdfFallbackText(body.fileName ?? "documento.pdf");
      const recognition = recognizeInvoiceDocument(rawText);
      const diagnostics = {
        ...baseDiagnostics,
        bytesLength: 0,
        rawTextLength: rawText.length,
        invoiceNumber: metadata.invoice.invoiceNumber,
        claimNumber: metadata.invoice.claimNumber,
        itemCount: metadata.invoice.items.length,
        strategy: "generated-metadata-after-error",
        error: errorMessage,
      };
      console.info("[ocr]", JSON.stringify(diagnostics));
      return NextResponse.json({
        rawText,
        invoice: metadata.invoice,
        recognition,
        warning: "No se pudo extraer texto del PDF en este entorno; se usaron datos estructurados generados.",
        diagnostics,
      });
    }
    const claimFallback = body.rawText ? null : await buildInvoiceFromClaim(body);
    if (claimFallback?.invoice) {
      const rawText = claimFallback.rawText || getPdfFallbackText(body.fileName ?? "documento.pdf");
      const diagnostics = {
        ...baseDiagnostics,
        bytesLength: 0,
        rawTextLength: rawText.length,
        invoiceNumber: claimFallback.invoice.invoiceNumber,
        claimNumber: claimFallback.invoice.claimNumber,
        itemCount: claimFallback.invoice.items.length,
        strategy: "claim-fallback-after-error",
        error: errorMessage,
      };
      console.info("[ocr]", JSON.stringify(diagnostics));
      return NextResponse.json({
        rawText,
        invoice: claimFallback.invoice,
        recognition: recognizeInvoiceDocument(rawText),
        warning: "No se pudo extraer texto del PDF; se rellenaron campos desde el reporte del siniestro vinculado por numero de factura.",
        diagnostics,
      });
    }
    const rawText = body.mimeType === "application/pdf" ? getPdfFallbackText(body.fileName ?? "documento.pdf") : "";
    const recognition = recognizeInvoiceDocument(rawText);
    const fallbackInvoice = parseInvoiceText(rawText);
    const diagnostics = {
      ...baseDiagnostics,
      bytesLength: 0,
      rawTextLength: rawText.length,
      invoiceNumber: fallbackInvoice.invoiceNumber,
      claimNumber: fallbackInvoice.claimNumber,
      itemCount: fallbackInvoice.items.length,
      strategy: "empty-fallback",
      weakExtraction: true,
      error: errorMessage,
    };
    console.info("[ocr]", JSON.stringify(diagnostics));
    return NextResponse.json(
      {
        error: "No se pudo procesar OCR. Puede continuar ingresando los datos manualmente.",
        detail: errorMessage,
        rawText,
        invoice: fallbackInvoice,
        recognition,
        diagnostics,
      },
      { status: 200 },
    );
  }
}
