import sharp from "sharp";

export type OptimizeProfile = "carousel" | "logo" | "product" | "none";

const PROFILES: Record<
  Exclude<OptimizeProfile, "none">,
  { maxWidth: number; maxHeight: number; quality: number }
> = {
  carousel: { maxWidth: 1920, maxHeight: 1200, quality: 82 },
  logo: { maxWidth: 800, maxHeight: 400, quality: 88 },
  product: { maxWidth: 1200, maxHeight: 1200, quality: 85 },
};

const RASTER_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif", ".tif", ".tiff", ".bmp", ".heic", ".heif"]);

export function optimizeProfileForFolder(folder: string): OptimizeProfile {
  if (folder === "historia") return "carousel";
  if (folder === "aliados") return "logo";
  if (folder === "productos") return "product";
  return "none";
}

export async function optimizeImageBuffer(
  input: Buffer,
  ext: string,
  profile: OptimizeProfile,
): Promise<{ buffer: Buffer; ext: string }> {
  if (profile === "none" || ext === ".svg" || ext === ".gif" || ext === ".ico") {
    return { buffer: input, ext };
  }

  if (!RASTER_EXT.has(ext)) {
    return { buffer: input, ext };
  }

  const cfg = PROFILES[profile];
  try {
    const optimized = await sharp(input, { failOn: "none" })
      .rotate()
      .resize(cfg.maxWidth, cfg.maxHeight, { fit: "inside", withoutEnlargement: true })
      .webp({ quality: cfg.quality, effort: 4 })
      .toBuffer();

    if (optimized.length >= input.length * 0.98 && ext !== ".heic" && ext !== ".heif") {
      return { buffer: input, ext };
    }

    return { buffer: optimized, ext: ".webp" };
  } catch {
    return { buffer: input, ext };
  }
}
