import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
};

const MAX_BYTES = 5 * 1024 * 1024;

export async function savePublicUpload(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Archivo vacío");
  }

  const ext = ALLOWED_TYPES[file.type];
  if (!ext) {
    throw new Error("Solo se permiten imágenes JPG, PNG, WebP, GIF o SVG");
  }

  if (file.size > MAX_BYTES) {
    throw new Error("La imagen no puede superar 5 MB");
  }

  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const dirs = [
    path.join(process.cwd(), "public", "uploads", safeFolder),
    path.join(process.cwd(), ".next", "standalone", "public", "uploads", safeFolder),
  ];

  for (const dir of dirs) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  }

  return `/uploads/${safeFolder}/${filename}`;
}

export async function readUploadFile(formData: FormData, field = "image"): Promise<File | null> {
  const value = formData.get(field);
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}
