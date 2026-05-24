import path from "node:path";
import { NextResponse } from "next/server";
import { readStoredFile } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: Promise<{ fileName: string }> }) {
  const { fileName } = await params;
  const safeName = path.basename(fileName);
  if (!safeName.endsWith(".pdf")) {
    return NextResponse.json({ error: "Archivo no permitido." }, { status: 400 });
  }

  try {
    const bytes = await readStoredFile({ storageKey: `generated/${safeName}` });
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeName}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Archivo no encontrado." }, { status: 404 });
  }
}
