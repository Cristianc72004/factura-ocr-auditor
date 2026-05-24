export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_UPLOAD_MB = Math.round(MAX_UPLOAD_BYTES / 1024 / 1024);

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export const STATUS_LABELS = {
  approved: "Aprobada",
  observed: "Observada",
  rejected: "Rechazada",
} as const;

export const SEVERITY_LABELS = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Crítica",
} as const;
