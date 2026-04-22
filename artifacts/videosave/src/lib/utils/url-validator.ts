export type Platform = "tiktok" | "youtube";

const TIKTOK_RE = /(?:^|\/\/)(?:www\.|m\.|vm\.)?tiktok\.com\//i;
const YOUTUBE_RE = /(?:^|\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)\//i;

export function isTiktokUrl(url: string): boolean {
  return TIKTOK_RE.test(url.trim());
}

export function isYoutubeUrl(url: string): boolean {
  return YOUTUBE_RE.test(url.trim());
}

export function detectPlatform(url: string): Platform | null {
  const u = url.trim();
  if (isTiktokUrl(u)) return "tiktok";
  if (isYoutubeUrl(u)) return "youtube";
  return null;
}

export function isValidUrl(url: string): boolean {
  try {
    new URL(url.trim());
    return true;
  } catch {
    return false;
  }
}
