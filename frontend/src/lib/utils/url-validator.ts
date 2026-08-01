export type Platform = "tiktok" | "youtube" | "vimeo";

export function isTiktokUrl(url: string): boolean {
  return url.trim().includes('tiktok.com')
}

export function isYoutubeUrl(url: string): boolean {
  const u = url.trim()
  return u.includes('youtube.com') || u.includes('youtu.be')
}

export function isVimeoUrl(url: string): boolean {
  return url.trim().includes('vimeo.com')
}

export function detectPlatform(url: string): Platform | null {
  if (isTiktokUrl(url)) return "tiktok"
  if (isYoutubeUrl(url)) return "youtube"
  if (isVimeoUrl(url)) return "vimeo"
  return null
}

export function isValidUrl(url: string): boolean {
  return isTiktokUrl(url) || isYoutubeUrl(url) || isVimeoUrl(url)
}