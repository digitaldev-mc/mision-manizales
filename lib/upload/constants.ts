export const IMAGE_ACCEPT =
  "image/jpeg,image/png,image/webp,image/gif,image/svg+xml,image/avif,image/bmp,image/tiff,image/x-icon,image/heic,image/heif,.jpg,.jpeg,.png,.webp,.gif,.svg,.avif,.bmp,.tif,.tiff,.ico,.heic,.heif";

export const IMAGE_FORMATS_LABEL =
  "JPG, PNG, WebP, GIF, SVG, AVIF, BMP, TIFF, ICO, HEIC · máx. 8 MB";

/** Tipos MIME → extensión de salida (normalizada para web). */
export const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/pjpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "image/svg+xml": ".svg",
  "image/avif": ".avif",
  "image/bmp": ".bmp",
  "image/x-bmp": ".bmp",
  "image/x-ms-bmp": ".bmp",
  "image/tiff": ".tif",
  "image/tif": ".tif",
  "image/x-icon": ".ico",
  "image/vnd.microsoft.icon": ".ico",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/x-citrix-pjpeg": ".jpg",
  "image/x-png": ".png",
};

/** Extensión del nombre de archivo → extensión de salida. */
export const NAME_TO_EXT: Record<string, string> = {
  ".jpg": ".jpg",
  ".jpeg": ".jpg",
  ".jpe": ".jpg",
  ".jfif": ".jpg",
  ".png": ".png",
  ".webp": ".webp",
  ".gif": ".gif",
  ".svg": ".svg",
  ".avif": ".avif",
  ".bmp": ".bmp",
  ".tif": ".tif",
  ".tiff": ".tif",
  ".ico": ".ico",
  ".heic": ".heic",
  ".heif": ".heif",
};

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
