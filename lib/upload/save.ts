import { existsSync } from "fs";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import {
  MAX_IMAGE_BYTES,
  MIME_TO_EXT,
  NAME_TO_EXT,
} from "@/lib/upload/constants";

export { IMAGE_ACCEPT, IMAGE_FORMATS_LABEL } from "@/lib/upload/constants";

function resolveImageExtension(file: File): string {
  const mime = file.type?.toLowerCase().split(";")[0]?.trim() ?? "";
  if (mime && mime !== "application/octet-stream" && MIME_TO_EXT[mime]) {
    return MIME_TO_EXT[mime];
  }

  const fromName = path.extname(file.name).toLowerCase();
  if (fromName && NAME_TO_EXT[fromName]) {
    return NAME_TO_EXT[fromName];
  }

  throw new Error(
    "Formato no reconocido. Usa JPG, PNG, WebP, GIF, SVG, AVIF, BMP, TIFF, ICO o HEIC.",
  );
}

function uploadDirs(folder: string): string[] {
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
  const dirs = [path.join(process.cwd(), "public", "uploads", safeFolder)];

  const standaloneRoot = path.join(process.cwd(), ".next", "standalone", "public", "uploads", safeFolder);
  if (existsSync(path.join(process.cwd(), ".next", "standalone"))) {
    dirs.push(standaloneRoot);
  }

  return dirs;
}

export async function savePublicUpload(file: File, folder: string): Promise<string> {
  if (!file || file.size === 0) {
    throw new Error("Archivo vacío");
  }

  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no puede superar 8 MB");
  }

  const ext = resolveImageExtension(file);
  const safeFolder = folder.replace(/[^a-z0-9-_]/gi, "");
  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  for (const dir of uploadDirs(safeFolder)) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, filename), buffer);
  }

  return `/uploads/${safeFolder}/${filename}`;
}

export async function readUploadFile(formData: FormData, field = "file"): Promise<File | null> {
  const value = formData.get(field);
  if (!(value instanceof File) || value.size === 0) return null;
  return value;
}
