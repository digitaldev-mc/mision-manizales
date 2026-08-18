export type MediaEmbed =
  | { type: "youtube"; embedUrl: string; externalUrl: string }
  | { type: "instagram"; embedUrl: string; externalUrl: string }
  | { type: "external"; externalUrl: string; label: string };

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function parseMediaUrl(raw: string | null | undefined): MediaEmbed | null {
  if (!raw) return null;
  const url = normalizeUrl(raw);
  if (!url) return null;

  const yt =
    url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([\w-]{6,})/i) ??
    url.match(/youtube\.com\/live\/([\w-]{6,})/i);
  if (yt?.[1]) {
    const id = yt[1];
    const externalUrl = `https://www.youtube.com/watch?v=${id}`;
    return {
      type: "youtube",
      embedUrl: `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`,
      externalUrl,
    };
  }

  const vimeo = url.match(/vimeo\.com\/(\d+)/i);
  if (vimeo?.[1]) {
    return {
      type: "youtube",
      embedUrl: `https://player.vimeo.com/video/${vimeo[1]}`,
      externalUrl: url,
    };
  }

  const ig =
    url.match(/instagram\.com\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i) ??
    url.match(/instagr\.am\/(?:p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (ig?.[1]) {
    const id = ig[1];
    const isReel = /\/reels?\//i.test(url);
    const pathType = isReel ? "reel" : url.includes("/tv/") ? "tv" : "p";
    const externalUrl = `https://www.instagram.com/${pathType}/${id}/`;
    return {
      type: "instagram",
      embedUrl: `https://www.instagram.com/${pathType}/${id}/embed`,
      externalUrl,
    };
  }

  if (/instagram\.com/i.test(url) || /instagr\.am/i.test(url)) {
    return { type: "external", externalUrl: url, label: "Ver en Instagram" };
  }

  return { type: "external", externalUrl: url, label: "Abrir enlace" };
}
