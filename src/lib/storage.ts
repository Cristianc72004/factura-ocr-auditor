import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { list, put } from "@vercel/blob";

export type StoredFile = {
  fileName: string;
  storageKey: string;
  filePath?: string;
  url?: string;
};

const localUploadDir = path.join(process.cwd(), "uploads");

export function isBlobStorageEnabled() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localPath(storageKey: string) {
  return path.join(localUploadDir, storageKey);
}

export async function writeStoredFile(params: {
  storageKey: string;
  bytes: Buffer | Uint8Array;
  contentType: string;
}): Promise<StoredFile> {
  const fileName = path.basename(params.storageKey);

  if (isBlobStorageEnabled()) {
    const blob = await put(params.storageKey, Buffer.from(params.bytes), {
      access: "public",
      contentType: params.contentType,
      allowOverwrite: true,
    });
    return { fileName, storageKey: params.storageKey, url: blob.url };
  }

  const target = localPath(params.storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, params.bytes);
  return { fileName, storageKey: params.storageKey, filePath: target };
}

export async function readStoredFile(params: { storageKey?: string; filePath?: string; url?: string }) {
  if (params.url) {
    const response = await fetch(params.url);
    if (!response.ok) throw new Error("No se pudo leer el archivo almacenado.");
    return Buffer.from(await response.arrayBuffer());
  }

  if (params.storageKey) {
    if (isBlobStorageEnabled()) {
      const found = await list({ prefix: params.storageKey, limit: 1 });
      const blob = found.blobs.find((item) => item.pathname === params.storageKey) ?? found.blobs[0];
      if (!blob) throw new Error("Archivo no encontrado en Blob.");
      const response = await fetch(blob.url);
      if (!response.ok) throw new Error("No se pudo leer el archivo en Blob.");
      return Buffer.from(await response.arrayBuffer());
    }
    return readFile(localPath(params.storageKey));
  }

  if (params.filePath) {
    return readFile(path.resolve(params.filePath));
  }

  throw new Error("No se recibio referencia de archivo.");
}

export async function readJsonStore<T>(storageKey: string, seed: T): Promise<T> {
  if (isBlobStorageEnabled()) {
    const found = await list({ prefix: storageKey, limit: 1 });
    const blob = found.blobs.find((item) => item.pathname === storageKey);
    if (!blob) {
      await writeJsonStore(storageKey, seed);
      return seed;
    }
    const response = await fetch(blob.url, { cache: "no-store" });
    if (!response.ok) return seed;
    return (await response.json()) as T;
  }

  const target = path.join(process.cwd(), ".local-data", storageKey);
  try {
    const content = await readFile(target, "utf8");
    return JSON.parse(content) as T;
  } catch {
    await writeJsonStore(storageKey, seed);
    return seed;
  }
}

export async function writeJsonStore<T>(storageKey: string, value: T) {
  const content = JSON.stringify(value, null, 2);

  if (isBlobStorageEnabled()) {
    await put(storageKey, content, {
      access: "public",
      contentType: "application/json",
      allowOverwrite: true,
    });
    return;
  }

  const target = path.join(process.cwd(), ".local-data", storageKey);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, content);
}
