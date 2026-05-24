"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, FileCheck2, Wand2 } from "lucide-react";
import { LayoutShell } from "@/components/LayoutShell";
import { formatCurrency } from "@/lib/utils";
import type { Claim } from "@/types/claim";
import type { DocumentRecognition } from "@/types/document";
import type { GeneratedInvoiceFile } from "@/types/generated-invoice";

type TestResult = {
  fileName: string;
  recognition: DocumentRecognition;
};

export default function GeneratorPage() {
  const [claims, setClaims] = useState<Claim[]>([]);
  const [claimNumber, setClaimNumber] = useState("");
  const [workshopName, setWorkshopName] = useState("");
  const [customerName, setCustomerName] = useState("Seguros del Norte S.A.");
  const [files, setFiles] = useState<GeneratedInvoiceFile[]>([]);
  const [tests, setTests] = useState<TestResult[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/claims")
      .then((response) => response.json())
      .then((data) => {
        const loaded = data.claims || [];
        setClaims(loaded);
        setClaimNumber(loaded[0]?.claimNumber || "");
        setWorkshopName(loaded[0]?.authorizedWorkshopNames?.[0] || "DigitFlow Solutions S.A.S.");
      });
  }, []);

  const selectedClaim = useMemo(() => claims.find((claim) => claim.claimNumber === claimNumber), [claimNumber, claims]);

  async function generate() {
    setBusy(true);
    setError("");
    setTests([]);
    try {
      const response = await fetch("/api/generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimNumber,
          customerName,
          workshopName,
          includeOptionalSignals: true,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "No se pudo generar la factura.");
      setFiles(data.files || []);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Error inesperado.");
    } finally {
      setBusy(false);
    }
  }

  async function testRecognition(file: GeneratedInvoiceFile) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/ocr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          filePath: file.filePath,
          storageKey: file.storageKey,
          url: file.url,
          fileName: file.fileName,
          mimeType: "application/pdf",
        }),
      });
      const data = await response.json();
      setTests((current) => [
        { fileName: file.fileName, recognition: data.recognition },
        ...current.filter((item) => item.fileName !== file.fileName),
      ]);
    } finally {
      setBusy(false);
    }
  }

  const testByFile = new Map(tests.map((item) => [item.fileName, item.recognition]));

  return (
    <LayoutShell>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-steel">Factura de prueba</p>
        <h1 className="mt-1 text-3xl font-semibold text-ink">Generar factura desde reporte</h1>
      </div>

      {error && <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-rejected">{error}</div>}

      <section className="rounded border border-line bg-white p-5 shadow-subtle">
        <div className="grid min-w-0 grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3">
          <label className="text-sm">
            <span className="mb-1 block font-medium text-steel">Reporte de siniestro</span>
            <select className="w-full rounded border border-line px-3 py-2 focus-ring" value={claimNumber} onChange={(event) => {
              const next = claims.find((claim) => claim.claimNumber === event.target.value);
              setClaimNumber(event.target.value);
              setWorkshopName(next?.authorizedWorkshopNames?.[0] || workshopName);
            }}>
              {claims.map((claim) => (
                <option key={claim.id} value={claim.claimNumber}>
                  {claim.claimNumber} - {claim.invoiceNumber || "sin factura"}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-steel">Taller emisor</span>
            <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={workshopName} onChange={(event) => setWorkshopName(event.target.value)} />
          </label>
          <label className="text-sm">
            <span className="mb-1 block font-medium text-steel">Aseguradora cliente</span>
            <input className="w-full rounded border border-line px-3 py-2 focus-ring" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          </label>
        </div>

        {selectedClaim && (
          <div className="mt-4 grid gap-3 rounded bg-surface p-4 text-sm md:grid-cols-3">
            <Info label="Factura informada" value={selectedClaim.invoiceNumber || "Sin dato"} />
            <Info label="Asegurado" value={selectedClaim.insuredName} />
            <Info label="Vehiculo" value={`${selectedClaim.vehicle} - ${selectedClaim.licensePlate}`} />
            <Info label="Dano" value={selectedClaim.reportedDamage} />
            <Info label="Estimado" value={formatCurrency(selectedClaim.estimatedRepairAmount)} />
            <Info label="Servicios" value={selectedClaim.authorizedServices.join(", ")} />
          </div>
        )}

        <button className="focus-ring mt-4 inline-flex items-center gap-2 rounded bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={busy || !claimNumber} onClick={generate}>
          <Wand2 className="size-4" />
          Generar factura
        </button>
      </section>

      <section className="mt-6 w-full overflow-x-auto rounded border border-line bg-white shadow-subtle">
        <table className="w-full min-w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase text-steel">
            <tr>
              <th className="px-5 py-3">Archivo</th>
              <th className="px-5 py-3">Factura</th>
              <th className="px-5 py-3">Siniestro</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Reconocimiento</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {files.map((file) => {
              const recognition = testByFile.get(file.fileName);
              return (
                <tr key={file.fileName}>
                  <td className="px-5 py-3 font-medium text-ink">{file.fileName}</td>
                  <td className="px-5 py-3 text-steel">{file.invoiceNumber}</td>
                  <td className="px-5 py-3 text-steel">{file.claimNumber}</td>
                  <td className="px-5 py-3 text-right font-semibold">{formatCurrency(file.total)}</td>
                  <td className="px-5 py-3">
                    {recognition ? (
                      <span className={recognition.isValid ? "rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-approved" : "rounded bg-red-50 px-2 py-1 text-xs font-semibold text-rejected"}>
                        {recognition.isValid ? "Valida" : "No valida"} - {Math.round(recognition.confidence * 100)}%
                      </span>
                    ) : (
                      <span className="text-xs text-steel">Sin probar</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <a className="focus-ring inline-flex items-center gap-2 rounded border border-line px-3 py-2 text-xs font-semibold text-navy" href={file.downloadUrl}>
                        <Download className="size-4" />
                        Descargar
                      </a>
                      <button className="focus-ring inline-flex items-center gap-2 rounded bg-navy px-3 py-2 text-xs font-semibold text-white disabled:opacity-50" disabled={busy} onClick={() => testRecognition(file)}>
                        <FileCheck2 className="size-4" />
                        Probar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {!files.length && (
              <tr>
                <td className="px-5 py-8 text-center text-steel" colSpan={6}>Todavia no hay factura generada.</td>
              </tr>
            )}
          </tbody>
        </table>
      </section>
    </LayoutShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold uppercase tracking-wide text-steel">{label}</p>
      <p className="mt-1 break-words font-semibold text-ink">{value}</p>
    </div>
  );
}
