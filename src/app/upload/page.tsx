"use client";

import { useState } from "react";
import Link from "next/link";
import { AuditReport } from "@/components/AuditReport";
import { ExtractedInvoiceForm } from "@/components/ExtractedInvoiceForm";
import { FileUploader } from "@/components/FileUploader";
import { LayoutShell } from "@/components/LayoutShell";
import { OcrPreview } from "@/components/OcrPreview";
import { CompletenessIndicator, ConfidenceMeter, StatusHint, WorkflowSteps } from "@/components/VisualIndicators";
import type { AuditReport as AuditReportType } from "@/types/audit";
import type { DocumentRecognition } from "@/types/document";
import type { ExtractedInvoice } from "@/types/invoice";

const emptyInvoice: ExtractedInvoice = {
  invoiceNumber: "",
  claimNumber: "",
  policyNumber: "",
  workshopName: "",
  workshopTaxId: "",
  customerName: "",
  customerTaxId: "",
  insuredName: "",
  vehicle: "",
  licensePlate: "",
  date: "",
  currency: "",
  cae: "",
  uuid: "",
  fiscalUrl: "",
  observations: "",
  subtotal: 0,
  tax: 0,
  total: 0,
  items: [],
};

type UploadedFile = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath?: string;
  storageKey?: string;
  url?: string;
};

async function readJsonResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw new Error("El servidor devolvió una respuesta inválida.");
  }
}

export default function UploadPage() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [rawText, setRawText] = useState("");
  const [invoice, setInvoice] = useState<ExtractedInvoice>(emptyInvoice);
  const [report, setReport] = useState<AuditReportType | null>(null);
  const [recognition, setRecognition] = useState<DocumentRecognition | null>(null);
  const [caseId, setCaseId] = useState("");

  async function upload(file: File) {
    setBusy(true);
    setError("");
    setReport(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const uploadResponse = await fetch("/api/upload", { method: "POST", body: form });
      const uploadData = await readJsonResponse(uploadResponse);
      if (!uploadResponse.ok) throw new Error(uploadData.error || "No se pudo subir el archivo.");
      setUploadedFile(uploadData);

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });
      const ocrData = await readJsonResponse(ocrResponse);
      if (!ocrResponse.ok) throw new Error(ocrData.error || "No se pudo procesar el OCR.");
      setRawText(ocrData.rawText || "");
      setInvoice({ ...emptyInvoice, ...ocrData.invoice });
      setRecognition(ocrData.recognition ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function reparse() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "No se pudo reprocesar el texto.");
      setInvoice({ ...emptyInvoice, ...data.invoice });
      setRecognition(data.recognition ?? null);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function audit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoice, rawOcrText: rawText, fileName: uploadedFile?.fileName }),
      });
      const data = await readJsonResponse(response);
      if (!response.ok) throw new Error(data.error || "No se pudo auditar.");
      setReport(data.report);
      setRecognition(data.recognition ?? recognition);
      setCaseId(data.case?.id || "");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  const requiredFields = [invoice.invoiceNumber, invoice.claimNumber, invoice.workshopName, invoice.insuredName, invoice.vehicle, invoice.licensePlate, invoice.date, invoice.total];
  const completedFields = requiredFields.filter((value) => Boolean(value)).length;
  const uploadSteps = [
    { label: "Documento", status: uploadedFile ? "done" : busy ? "current" : "current" },
    { label: "OCR", status: rawText ? "done" : uploadedFile ? "current" : "pending" },
    { label: "Datos", status: completedFields >= 6 && invoice.items.length ? "done" : rawText ? "current" : "pending" },
    { label: "Auditoria", status: report ? "done" : recognition?.isValid === false ? "blocked" : invoice.items.length ? "current" : "pending" },
  ] as const;

  return (
    <LayoutShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Carga y OCR</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Auditar nueva factura</h1>
      </div>
      <div className="mb-6">
        <WorkflowSteps steps={uploadSteps.map((step) => ({ label: step.label, status: step.status }))} />
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-rejected">{error}</div>}
      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-4">
          <FileUploader uploadedFile={uploadedFile} busy={busy} onUpload={upload} />
          <CompletenessIndicator label="Datos clave" completed={completedFields} total={requiredFields.length} />
          <CompletenessIndicator label="Items cobrados" completed={invoice.items.length ? 1 : 0} total={1} />
          <button className="focus-ring w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || invoice.items.length === 0 || recognition?.isValid === false} onClick={audit}>
            Auditar factura
          </button>
          {caseId && (
            <Link className="block rounded border border-line bg-white px-4 py-3 text-center text-sm font-semibold text-navy" href={`/cases/${caseId}`}>
              Abrir caso auditado
            </Link>
          )}
        </div>
        <div className="grid min-w-0 gap-6">
          {recognition && (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
              <StatusHint tone={recognition.isValid ? "success" : "danger"} title={recognition.isValid ? "Factura valida" : "Documento no valido"} value={recognition.message} />
              <ConfidenceMeter value={recognition.confidence} valid={recognition.isValid} />
            </div>
          )}
          <OcrPreview rawText={rawText} onChange={setRawText} />
          <button className="focus-ring w-full rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50" disabled={busy || !rawText} onClick={reparse}>
            Reprocesar texto corregido
          </button>
          <ExtractedInvoiceForm invoice={invoice} onChange={setInvoice} />
          {report && <AuditReport report={report} />}
        </div>
      </div>
    </LayoutShell>
  );
}
