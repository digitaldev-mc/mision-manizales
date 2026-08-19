import { existsSync } from "fs";
import { readFile } from "fs/promises";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".jpe": "image/jpeg",
  ".jfif": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".ico": "image/x-icon",
  ".heic": "image/heic",
  ".heif": "image/heif",
};

function resolveUploadPath(segments: string[]): string | null {
  const rel = segments.join("/");
  if (!rel || rel.includes("..")) return null;

  const candidates = [
    path.join(process.cwd(), "public", "uploads", rel),
    path.join(process.cwd(), ".next", "standalone", "public", "uploads", rel),
  ];

  for (const filePath of candidates) {
    if (existsSync(filePath)) return filePath;
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await context.params;
  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": MIME[ext] ?? "application/octet-stream",
      "Cache-Control": "public, max-age=86400",
    },
  });
}
