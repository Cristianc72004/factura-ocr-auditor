import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { GeneratedInvoiceFile, GeneratedInvoiceRequest } from "@/types/generated-invoice";
import { demoClaims, demoPolicies, demoWorkshops } from "./mock-data";
import { uid } from "./utils";

type GeneratedLine = {
  code: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  discount: number;
};

const lineCatalog: GeneratedLine[] = [
  { code: "RV-TOY-0215", description: "Optica delantera izquierda", quantity: 1, unit: "u", unitPrice: 85000, discount: 0 },
  { code: "RV-TOY-0456", description: "Paragolpes delantero", quantity: 1, unit: "u", unitPrice: 120000, discount: 0 },
  { code: "RV-TOY-0789", description: "Guardabarro delantero izq.", quantity: 1, unit: "u", unitPrice: 45500, discount: 0 },
  { code: "MAT-PIN-01", description: "Pintura base poliuretano (1L)", quantity: 0.8, unit: "L", unitPrice: 28000, discount: 0 },
  { code: "MAT-LIJ-01", description: "Lija al agua grano 600", quantity: 2, unit: "u", unitPrice: 650, discount: 0 },
  { code: "MO-CH-01", description: "Desarme y armado de paragolpes", quantity: 1.5, unit: "h", unitPrice: 18000, discount: 0 },
  { code: "MO-CH-02", description: "Reparacion y preparacion de guardabarro", quantity: 2, unit: "h", unitPrice: 18000, discount: 0 },
  { code: "MO-CH-03", description: "Pintura de piezas", quantity: 2.5, unit: "h", unitPrice: 18000, discount: 0 },
  { code: "SV-DIG-01", description: "Diagnostico computarizado OBD-II", quantity: 1, unit: "u", unitPrice: 12000, discount: 10 },
];

function money(value: number) {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function sequenceNumber(value: number) {
  return `0001-${String(value).padStart(8, "0")}`;
}

function claimNumber(base: string, index: number) {
  const requested = demoClaims.find((claim) => claim.claimNumber === base);
  if (requested && index === 0) return requested.claimNumber;
  const registered = demoClaims[index % demoClaims.length];
  if (registered) return registered.claimNumber;
  const numeric = Number(base.replace(/\D/g, "") || "1234567") + index;
  return String(numeric).padStart(8, "0").slice(-8);
}

function pickLines(index: number) {
  const count = 5 + (index % 4);
  return lineCatalog.slice(index % 2, index % 2 + count);
}

function lineTotal(line: GeneratedLine, index: number) {
  const variation = 1 + ((index % 5) - 2) * 0.025;
  const gross = line.quantity * line.unitPrice * variation;
  return Number((gross * (1 - line.discount / 100)).toFixed(2));
}

function drawRow(
  page: import("pdf-lib").PDFPage,
  y: number,
  cells: string[],
  font: import("pdf-lib").PDFFont,
  size = 8,
  isHeader = false,
  fill = false,
) {
  const xs = [42, 72, 128, 320, 360, 405, 475, 535];
  if (isHeader) {
    page.drawRectangle({ x: 38, y: y - 5, width: 520, height: 18, color: rgb(0.07, 0.14, 0.28) });
  } else if (fill) {
    page.drawRectangle({ x: 38, y: y - 5, width: 520, height: 18, color: rgb(0.96, 0.98, 1) });
  }
  page.drawLine({ start: { x: 38, y: y - 7 }, end: { x: 558, y: y - 7 }, thickness: 0.4, color: rgb(0.78, 0.82, 0.88) });
  cells.forEach((cell, index) => {
    page.drawText(cell, { x: xs[index], y, size, font, color: isHeader ? rgb(1, 1, 1) : rgb(0.08, 0.13, 0.24) });
  });
}

function drawPanel(page: import("pdf-lib").PDFPage, x: number, y: number, width: number, height: number) {
  page.drawRectangle({
    x,
    y,
    width,
    height,
    borderWidth: 0.8,
    borderColor: rgb(0.78, 0.82, 0.88),
    color: rgb(1, 1, 1),
  });
}

function drawSectionTitle(page: import("pdf-lib").PDFPage, text: string, x: number, y: number, font: import("pdf-lib").PDFFont) {
  page.drawRectangle({ x, y: y - 5, width: 236, height: 18, color: rgb(0.91, 0.94, 0.98) });
  page.drawText(text, { x: x + 8, y, size: 10, font, color: rgb(0.07, 0.14, 0.28) });
}

async function createPdf(params: {
  request: GeneratedInvoiceRequest;
  index: number;
  invoiceNumber: string;
  claimNumber: string;
}) {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]);
  const regular = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const claim = demoClaims.find((item) => item.claimNumber === params.claimNumber) ?? demoClaims[params.index % demoClaims.length];
  const policy = demoPolicies.find((item) => item.policyNumber === claim?.policyNumber) ?? demoPolicies[0];
  const workshop = demoWorkshops.find((item) => item.workshopName === (params.request.workshopName || "DigitFlow Solutions S.A.S.")) ?? demoWorkshops[0];
  const vehicle = { name: claim?.vehicle || policy.vehicle, plate: claim?.licensePlate || policy.licensePlate };
  const insuredName = claim?.insuredName || policy.clientName;
  const lines = pickLines(params.index);
  const emitted = new Date(2024, 4, 28 + (params.index % 3));
  const subtotal = Number(lines.reduce((total, line) => total + lineTotal(line, params.index), 0).toFixed(2));
  const tax = Number((subtotal * 0.21).toFixed(2));
  const total = Number((subtotal + tax).toFixed(2));
  const uuid = `${uid("pdf")}-digitflow-${params.index}`.slice(0, 36);

  page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(0.97, 0.98, 1) });
  drawPanel(page, 28, 714, 330, 96);
  drawPanel(page, 370, 642, 188, 168);
  page.drawRectangle({ x: 28, y: 810, width: 530, height: 12, color: rgb(0.07, 0.14, 0.28) });

  page.drawText(workshop.workshopName, { x: 42, y: 792, size: 17, font: bold, color: rgb(0.07, 0.14, 0.28) });
  page.drawText(`NIT: ${workshop.taxId}`, { x: 42, y: 774, size: 9, font: regular });
  page.drawText("Ing. Butty 240, Piso 12, CABA", { x: 42, y: 760, size: 9, font: regular });
  page.drawText("admin@digitflowsolutions.com", { x: 42, y: 746, size: 9, font: regular });
  page.drawRectangle({ x: 488, y: 768, width: 42, height: 36, borderWidth: 1, borderColor: rgb(0.07, 0.14, 0.28), color: rgb(1, 1, 1) });
  page.drawText("A", { x: 502, y: 779, size: 24, font: bold, color: rgb(0.07, 0.14, 0.28) });
  page.drawText("Resp. Inscripto", { x: 444, y: 756, size: 9, font: regular });
  page.drawText("FACTURA ELECTRONICA", { x: 390, y: 732, size: 14, font: bold, color: rgb(0.07, 0.14, 0.28) });
  page.drawText(`N ${params.invoiceNumber}`, { x: 412, y: 710, size: 11, font: bold });
  page.drawText(`Emision: ${emitted.toLocaleDateString("es-AR")}`, { x: 380, y: 690, size: 9, font: regular });
  page.drawText("Moneda: ARS - Peso Argentino", { x: 380, y: 676, size: 9, font: regular });
  page.drawText("CAE: 74293847593847", { x: 380, y: 662, size: 9, font: regular });
  page.drawText("Autorizado por AFIP", { x: 380, y: 648, size: 9, font: regular });

  drawPanel(page, 28, 646, 330, 58);
  drawSectionTitle(page, "DATOS DEL CLIENTE", 36, 686, bold);
  page.drawText(`Razon Social: ${params.request.customerName || policy.insurerName}`, { x: 42, y: 668, size: 9, font: regular });
  page.drawText("CUIT: 30-50000000-1", { x: 42, y: 656, size: 9, font: regular });
  page.drawText("Condicion IVA: Responsable Inscripto", { x: 180, y: 656, size: 9, font: regular });

  drawPanel(page, 28, 570, 530, 58);
  drawSectionTitle(page, "DATOS DEL SINIESTRO", 36, 610, bold);
  page.drawText(`N Siniestro: ${params.claimNumber}`, { x: 42, y: 592, size: 9, font: regular });
  page.drawText(`Asegurado: ${insuredName}`, { x: 210, y: 592, size: 9, font: regular });
  page.drawText(`Poliza: ${policy.policyNumber}`, { x: 400, y: 592, size: 9, font: regular });
  page.drawText(`Vehiculo: ${vehicle.name} - ${vehicle.plate}`, { x: 42, y: 578, size: 9, font: regular });

  drawPanel(page, 28, 238, 530, 316);
  drawRow(page, 532, ["ITEM", "CODIGO", "DESCRIPCION", "CANT.", "UNID.", "P. UNITARIO", "DESC.", "IMPORTE"], bold, 7, true);
  let y = 514;
  lines.forEach((line, lineIndex) => {
    drawRow(
      page,
      y,
      [
        String(lineIndex + 1),
        line.code,
        line.description.slice(0, 34),
        money(line.quantity),
        line.unit,
        money(line.unitPrice),
        money(line.discount),
        money(lineTotal(line, params.index)),
      ],
      regular,
      7,
      false,
      lineIndex % 2 === 1,
    );
    y -= 18;
  });

  drawPanel(page, 28, 132, 330, 82);
  drawSectionTitle(page, "OBSERVACIONES", 36, 194, bold);
  page.drawText("Reparacion segun alcance autorizado por Seguros del Norte S.A.", { x: 42, y: 162, size: 8, font: regular });
  page.drawText("Incluye materiales, mano de obra y pintura.", { x: 42, y: 150, size: 8, font: regular });

  drawPanel(page, 370, 132, 188, 82);
  page.drawText(`SUBTOTAL: ${money(subtotal)}`, { x: 390, y: 188, size: 10, font: bold });
  page.drawText(`IVA (21%): ${money(tax)}`, { x: 390, y: 170, size: 10, font: bold });
  page.drawRectangle({ x: 382, y: 141, width: 160, height: 21, color: rgb(0.07, 0.14, 0.28) });
  page.drawText(`TOTAL ARS: ${money(total)}`, { x: 390, y: 148, size: 11, font: bold, color: rgb(1, 1, 1) });

  drawPanel(page, 28, 46, 530, 70);
  page.drawText("IDENTIFICADOR DEL DOCUMENTO", { x: 42, y: 96, size: 9, font: bold });
  page.drawText(`UUID: ${uuid}`, { x: 42, y: 90, size: 8, font: regular });
  if (params.request.includeOptionalSignals !== false) {
    page.drawText("COMPROBANTE FISCAL DIGITAL", { x: 42, y: 72, size: 9, font: bold });
    page.drawText("Verifique en: https://www.afip.gob.ar/fe/consulta", { x: 42, y: 58, size: 8, font: regular });
  }
  page.drawText("GRACIAS POR SU CONFIANZA - ORIGINAL - DigitFlow Solutions S.A.S.", { x: 126, y: 34, size: 8, font: bold });

  const bytes = await pdf.save();
  return { bytes, total };
}

export async function generateDigitFlowInvoices(request: GeneratedInvoiceRequest): Promise<GeneratedInvoiceFile[]> {
  const count = Math.min(Math.max(Number(request.count || 1), 1), 25);
  const baseInvoiceNumber = Number(request.baseInvoiceNumber || 1234);
  const baseClaimNumber = request.baseClaimNumber || "01234567";
  const outputDir = path.join(process.cwd(), "uploads", "generated");
  await mkdir(outputDir, { recursive: true });

  const files: GeneratedInvoiceFile[] = [];
  for (let index = 0; index < count; index += 1) {
    const invoiceNumber = sequenceNumber(baseInvoiceNumber + index);
    const generatedClaimNumber = claimNumber(baseClaimNumber, index);
    const pdf = await createPdf({ request, index, invoiceNumber, claimNumber: generatedClaimNumber });
    const fileName = `Factura_DigitFlow_${invoiceNumber.replace("-", "_")}_${uid("gen")}.pdf`;
    const filePath = path.join(outputDir, fileName);
    await writeFile(filePath, pdf.bytes);
    files.push({
      fileName,
      filePath,
      downloadUrl: `/api/generated/${fileName}`,
      invoiceNumber,
      claimNumber: generatedClaimNumber,
      total: pdf.total,
    });
  }

  return files;
}
