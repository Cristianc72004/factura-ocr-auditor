import type { DocumentRecognition } from "@/types/document";
import { normalizeText } from "../utils";

const digitflowSignals = [
  { key: "Emisor DigitFlow", terms: ["digitflow solutions", "digitflowsolutions"] },
  { key: "Factura electronica", terms: ["factura electronica", "factura"] },
  { key: "Siniestro", terms: ["datos del siniestro", "n siniestro", "n de siniestro", "siniestro"] },
  { key: "CAE o AFIP", terms: ["cae", "afip", "autorizado por afip"] },
  { key: "Total ARS", terms: ["total ars", "iva 21", "subtotal"] },
  { key: "Tabla de items", terms: ["item codigo descripcion", "p unitario", "importe", "mano de obra"] },
  { key: "UUID", terms: ["uuid", "identificador del documento", "identificador unico"] },
];

const requiredSignals = ["Emisor DigitFlow", "Factura electronica", "Siniestro", "Total ARS"];

export function recognizeInvoiceDocument(rawText: string): DocumentRecognition {
  const normalized = normalizeText(rawText);
  const matchedSignals = digitflowSignals
    .filter((signal) => signal.terms.some((term) => normalized.includes(normalizeText(term))))
    .map((signal) => signal.key);
  const missingSignals = digitflowSignals
    .filter((signal) => !signal.terms.some((term) => normalized.includes(normalizeText(term))))
    .map((signal) => signal.key);
  const confidence = Number((matchedSignals.length / digitflowSignals.length).toFixed(2));
  const hasRequiredSignals = requiredSignals.every((signal) => matchedSignals.includes(signal));
  const isValid = hasRequiredSignals && confidence >= 0.55;

  return {
    isValid,
    template: isValid ? "digitflow_invoice" : "unknown",
    confidence,
    matchedSignals,
    missingSignals,
    message: isValid
      ? "Factura valida: modelo DigitFlow reconocido."
      : "Documento no valido: no corresponde al modelo de factura DigitFlow activado para este prototipo.",
  };
}
