export type Platform = "tiktok" | "youtube" | "vimeo" | "instagram";

export function isTiktokUrl(url: string): boolean {
  return url.trim().toLowerCase().includes('tiktok.com');
}

export function isYoutubeUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes('youtube.com') || u.includes('youtu.be');
}

export function isVimeoUrl(url: string): boolean {
  return url.trim().toLowerCase().includes('vimeo.com');
}

export function isInstagramUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return u.includes('instagram.com') || u.includes('instagr.am');
}

export function detectPlatform(url: string): Platform | null {
  if (isTiktokUrl(url)) return "tiktok";
  if (isYoutubeUrl(url)) return "youtube";
  if (isVimeoUrl(url)) return "vimeo";
  if (isInstagramUrl(url)) return "instagram";
  return null;
}

export function isValidUrl(url: string): boolean {
  return isTiktokUrl(url) || isYoutubeUrl(url) || isVimeoUrl(url) || isInstagramUrl(url);
}