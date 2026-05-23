"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutShell } from "@/components/LayoutShell";
import { FileUploader } from "@/components/FileUploader";
import { OcrPreview } from "@/components/OcrPreview";
import { ExtractedInvoiceForm } from "@/components/ExtractedInvoiceForm";
import { AuditReport } from "@/components/AuditReport";
import type { AuditReport as AuditReportType } from "@/types/audit";
import type { DocumentRecognition } from "@/types/document";
import type { ExtractedInvoice } from "@/types/invoice";

const emptyInvoice: ExtractedInvoice = {
  invoiceNumber: "",
  claimNumber: "",
  workshopName: "",
  insuredName: "",
  vehicle: "",
  licensePlate: "",
  date: "",
  uuid: "",
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
  filePath: string;
};

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
      const uploadData = await uploadResponse.json();
      if (!uploadResponse.ok) throw new Error(uploadData.error || "No se pudo subir el archivo.");
      setUploadedFile(uploadData);

      const ocrResponse = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(uploadData),
      });
      const ocrData = await ocrResponse.json();
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
      const data = await response.json();
      setInvoice({ ...emptyInvoice, ...data.invoice });
      setRecognition(data.recognition ?? null);
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
      const data = await response.json();
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

  return (
    <LayoutShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Carga y OCR</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Auditar nueva factura</h1>
      </div>
      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-rejected">{error}</div>}
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-4">
          <FileUploader uploadedFile={uploadedFile} busy={busy} onUpload={upload} />
          <button className="focus-ring w-full rounded border border-line bg-white px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50" disabled={busy || !rawText} onClick={reparse}>
            Reprocesar texto corregido
          </button>
          <button className="focus-ring w-full rounded bg-navy px-4 py-3 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || invoice.items.length === 0 || recognition?.isValid === false} onClick={audit}>
            Auditar factura
          </button>
          {caseId && (
            <Link className="block rounded border border-line bg-white px-4 py-3 text-center text-sm font-semibold text-navy" href={`/cases/${caseId}`}>
              Abrir caso auditado
            </Link>
          )}
        </div>
        <div className="grid gap-6">
          {recognition && (
            <div className={recognition.isValid ? "rounded border border-emerald-200 bg-emerald-50 p-4 text-sm text-approved" : "rounded border border-red-200 bg-red-50 p-4 text-sm text-rejected"}>
              <p className="font-semibold">{recognition.isValid ? "Factura válida reconocida" : "Documento no válido"}</p>
              <p className="mt-1">{recognition.message}</p>
              <p className="mt-2 text-xs">Confianza: {Math.round(recognition.confidence * 100)}%</p>
              {!recognition.isValid && recognition.missingSignals.length > 0 && (
                <p className="mt-2 text-xs">Faltan señales: {recognition.missingSignals.join(", ")}</p>
              )}
            </div>
          )}
          <OcrPreview rawText={rawText} onChange={setRawText} />
          <ExtractedInvoiceForm invoice={invoice} onChange={setInvoice} />
          {report && <AuditReport report={report} />}
        </div>
      </div>
    </LayoutShell>
  );
}
