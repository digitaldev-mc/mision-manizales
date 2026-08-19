import sharp from "sharp";

export type OptimizeProfile = "carousel" | "logo" | "product" | "none";

const PROFILES: Record<
  Exclude<OptimizeProfile, "none">,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  carousel: { maxWidth: 1920, maxHeight: 1200, quality: 82 },
  logo: { maxWidth: 800, maxHeight: 400, quality: 88 },
  product: { maxWidth: 1200, maxHeight: 1200, quality: 86 },
};

const RASTER_EXT = new Set([
  ".jpg",
  ".jpeg",
  ".jpe",
  ".jfif",
  ".png",
  ".webp",
  ".avif",
  ".tif",
  ".tiff",
  ".bmp",
  ".heic",
  ".heif",
]);

export function optimizeProfileForFolder(folder: string): OptimizeProfile {
  if (folder === "historia") return "carousel";
  if (folder === "aliados") return "logo";
  if (folder === "productos") return "product";
  return "none";
}

function normalizeExt(ext: string): string {
  if (ext === ".jpeg" || ext === ".jpe" || ext === ".jfif") return ".jpg";
  return ext;
}

export async function optimizeImageBuffer(
  input: Buffer,
  ext: string,
  profile: OptimizeProfile,
): Promise<{ buffer: Buffer; ext: string }> {
  const normalizedExt = normalizeExt(ext.toLowerCase());

  if (profile === "none" || normalizedExt === ".svg" || normalizedExt === ".gif" || normalizedExt === ".ico") {
    return { buffer: input, ext: normalizedExt };
  }

  if (!RASTER_EXT.has(normalizedExt) && !RASTER_EXT.has(ext.toLowerCase())) {
    return { buffer: input, ext: normalizedExt };
  }

  const cfg = PROFILES[profile];
  try {
    let pipeline = sharp(input, { failOn: "none" })
      .rotate()
      .resize(cfg.maxWidth, cfg.maxHeight, { fit: "inside", withoutEnlargement: true });

    let optimized: Buffer;
    let outExt: string;

    if (profile === "product" || profile === "carousel") {
      optimized = await pipeline.jpeg({ quality: cfg.quality, mozjpeg: true }).toBuffer();
      outExt = ".jpg";
    } else {
      optimized = await pipeline.webp({ quality: cfg.quality, effort: 4 }).toBuffer();
      outExt = ".webp";
    }

    if (
      optimized.length >= input.length * 0.98 &&
      normalizedExt !== ".heic" &&
      normalizedExt !== ".heif"
    ) {
      return { buffer: input, ext: normalizedExt === ".jpg" ? ".jpg" : normalizedExt };
    }

    return { buffer: optimized, ext: outExt };
  } catch {
    return { buffer: input, ext: normalizedExt === ".jpg" ? ".jpg" : normalizedExt };
  }
}
