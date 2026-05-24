"use client";

import { UploadCloud } from "lucide-react";
import { MAX_UPLOAD_MB } from "@/lib/constants";

type UploadedFile = {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  filePath?: string;
  storageKey?: string;
  url?: string;
};

export function FileUploader({
  uploadedFile,
  busy,
  onUpload,
}: {
  uploadedFile: UploadedFile | null;
  busy: boolean;
  onUpload: (file: File) => void;
}) {
  return (
    <div className="rounded border border-dashed border-line bg-white p-5">
      <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded bg-surface px-4 py-10 text-center focus-ring">
        <UploadCloud className="size-9 text-navy" />
        <span className="font-semibold text-ink">{busy ? "Procesando archivo..." : "Subir factura o documento del siniestro"}</span>
        <span className="text-sm text-steel">PDF, PNG, JPG, JPEG o DOCX - maximo {MAX_UPLOAD_MB} MB</span>
        <input
          className="sr-only"
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          disabled={busy}
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onUpload(file);
          }}
        />
      </label>
      {uploadedFile && (
        <div className="mt-4 rounded border border-line p-3 text-sm">
          <p className="font-semibold text-ink">{uploadedFile.originalName}</p>
          <p className="text-steel">{uploadedFile.mimeType} - {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB</p>
        </div>
      )}
    </div>
  );
}
