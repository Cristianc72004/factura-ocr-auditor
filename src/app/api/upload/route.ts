import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/constants";
import { writeStoredFile } from "@/lib/storage";
import { uid } from "@/lib/utils";

type UploadedFormFile = {
  name: string;
  type: string;
  size: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
};

function safeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return `${base || "documento"}_${uid("file")}${ext}`;
}

function isUploadedFormFile(value: FormDataEntryValue | null): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    "type" in value &&
    "size" in value &&
    "arrayBuffer" in value &&
    typeof value.name === "string" &&
    typeof value.type === "string" &&
    typeof value.size === "number" &&
    typeof value.arrayBuffer === "function"
  );
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!isUploadedFormFile(file)) {
    return NextResponse.json({ error: "No se recibió archivo." }, { status: 400 });
  }
  const uploadedFile = file as UploadedFormFile;

  if (!ALLOWED_MIME_TYPES.includes(uploadedFile.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Use PDF, PNG, JPG, JPEG o DOCX." }, { status: 400 });
  }
  if (uploadedFile.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `El archivo supera el tamaño máximo de ${MAX_UPLOAD_MB} MB.` }, { status: 400 });
  }

  const fileName = safeFileName(uploadedFile.name);
  const bytes = Buffer.from(await uploadedFile.arrayBuffer());
  const stored = await writeStoredFile({
    storageKey: `invoices/${fileName}`,
    bytes,
    contentType: uploadedFile.type,
  });

  return NextResponse.json({
    fileName,
    originalName: uploadedFile.name,
    mimeType: uploadedFile.type,
    size: uploadedFile.size,
    filePath: stored.filePath,
    storageKey: stored.storageKey,
    url: stored.url,
  });
}
