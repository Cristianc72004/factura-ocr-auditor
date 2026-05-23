import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { ALLOWED_MIME_TYPES, MAX_UPLOAD_BYTES } from "@/lib/constants";
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
    return NextResponse.json({ error: "No se recibió archivo." }, { status: 400 });
  }
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: "Tipo de archivo no permitido. Use PDF, PNG, JPG o JPEG." }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "El archivo supera el tamaño máximo de 8 MB." }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "uploads", "invoices");
  await mkdir(uploadDir, { recursive: true });
  const fileName = safeFileName(file.name);
  const filePath = path.join(uploadDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, bytes);

  return NextResponse.json({
    fileName,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    filePath,
  });
}
