import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES, MAX_UPLOAD_MB } from "@/lib/constants";
import { writeStoredFile } from "@/lib/storage";
import { uid } from "@/lib/utils";

function safeFileName(name: string) {
  const ext = path.extname(name).toLowerCase();
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  return `${base || "documento"}_${uid("file")}${ext}`;
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No se recibio archivo." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Use PDF, PNG, JPG, JPEG o DOCX." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: `El archivo supera el tamano maximo de ${MAX_UPLOAD_MB} MB.` }, { status: 400 });
  }

  const fileName = safeFileName(file.name);
  const bytes = Buffer.from(await file.arrayBuffer());
  const stored = await writeStoredFile({
    storageKey: `invoices/${fileName}`,
    bytes,
    contentType: file.type,
  });

  return NextResponse.json({
    fileName,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    filePath: stored.filePath,
    storageKey: stored.storageKey,
    url: stored.url,
  });
}
