import { useMutation, useQuery, type UseQueryOptions } from "@tanstack/react-query";

export type Platform = "tiktok" | "youtube" | "vimeo" | "instagram";

export interface VideoFormatOption {
  id: string;
  format: "mp4" | "mp3";
  quality: string;
  label: string;
}

export interface VideoInfo {
  id?: string;
  platform: Platform;
  title: string;
  uploader?: string | null;
  thumbnail?: string | null;
  duration?: number | null;
  viewCount?: number | null;
  likeCount?: number | null;
  formats: VideoFormatOption[];
}

export interface DownloadStartResponse {
  jobId: string;
  downloadUrl: string;
  filename: string;
  fileSize?: number | null;
  title?: string | null;
  thumbnail?: string | null;
}

export interface DownloadStats {
  totalDownloads: number;
  tiktokDownloads: number;
  youtubeDownloads: number;
  instagramDownloads?: number;
  downloadsToday: number;
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
}

export interface TokenResponse {
  accessToken: string;
  user: User;
}

export interface MeResponse {
  user: User | null;
}

export interface HistoryItem {
  id: string;
  platform: Platform;
  originalUrl: string;
  videoTitle?: string | null;
  thumbnailUrl?: string | null;
  format: "mp4" | "mp3";
  quality?: string | null;
  fileSize: number;
  downloadedAt: string;
}

export interface HistoryListResponse {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  tags: string[];
  coverImage?: string | null;
  publishedAt: string;
  contentMarkdown: string;
}

const apiOrigin = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_URL) || "http://localhost:8000";

function toApiUrl(path: string): string {
  const base = String(apiOrigin).replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

function mapError(status: number, detail: unknown, fallback: string): Error {
  const detailMessage =
    (typeof detail === "string" && detail) ||
    (detail && typeof detail === "object" && "message" in detail && typeof (detail as { message?: unknown }).message === "string" ? (detail as { message: string }).message : "") ||
    (detail && typeof detail === "object" && "detail" in detail && typeof (detail as { detail?: unknown }).detail === "string" ? (detail as { detail: string }).detail : "") ||
    fallback;

  const err = new Error(detailMessage) as Error & {
    response: { data: { message: string }; status: number };
  };
  err.response = { data: { message: detailMessage }, status };
  return err;
}

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(toApiUrl(path), {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });

  const raw = await res.text();
  const data = raw ? (JSON.parse(raw) as unknown) : undefined;

  if (!res.ok) {
    throw mapError(res.status, data, `Request failed with status ${res.status}`);
  }

  return data as T;
}

function normalizeDownloadStartResponse(value: {
  job_id?: string;
  jobId?: string;
  download_url?: string;
  downloadUrl?: string;
  filename: string;
  file_size?: number | null;
  fileSize?: number | null;
  title?: string | null;
  thumbnail?: string | null;
}): DownloadStartResponse {
  return {
    jobId: value.jobId ?? value.job_id ?? "",
    downloadUrl: value.downloadUrl ?? value.download_url ?? "",
    filename: value.filename,
    fileSize: value.fileSize ?? value.file_size ?? null,
    title: value.title ?? null,
    thumbnail: value.thumbnail ?? null,
  };
}

function normalizeStats(value: {
  total_downloads?: number;
  tiktok_downloads?: number;
  youtube_downloads?: number;
  instagram_downloads?: number;
  downloads_today?: number;
  totalDownloads?: number;
  tiktokDownloads?: number;
  youtubeDownloads?: number;
  instagramDownloads?: number;
  downloadsToday?: number;
}): DownloadStats {
  return {
    totalDownloads: value.totalDownloads ?? value.total_downloads ?? 0,
    tiktokDownloads: value.tiktokDownloads ?? value.tiktok_downloads ?? 0,
    youtubeDownloads: value.youtubeDownloads ?? value.youtube_downloads ?? 0,
    instagramDownloads: value.instagramDownloads ?? value.instagram_downloads ?? 0,
    downloadsToday: value.downloadsToday ?? value.downloads_today ?? 0,
  };
}

function normalizeTokenResponse(value: {
  access_token?: string;
  accessToken?: string;
  user: User;
}): TokenResponse {
  return {
    accessToken: value.accessToken ?? value.access_token ?? "",
    user: value.user,
  };
}

function normalizeHistoryItem(value: {
  id: string;
  platform: Platform;
  original_url?: string;
  originalUrl?: string;
  video_title?: string | null;
  videoTitle?: string | null;
  thumbnail_url?: string | null;
  thumbnailUrl?: string | null;
  file_format?: "mp4" | "mp3";
  format?: "mp4" | "mp3";
  quality?: string | null;
  file_size?: number;
  fileSize?: number;
  downloaded_at?: string;
  downloadedAt?: string;
}): HistoryItem {
  return {
    id: value.id,
    platform: value.platform,
    originalUrl: value.originalUrl ?? value.original_url ?? "",
    videoTitle: value.videoTitle ?? value.video_title ?? null,
    thumbnailUrl: value.thumbnailUrl ?? value.thumbnail_url ?? null,
    format: value.format ?? value.file_format ?? "mp4",
    quality: value.quality ?? null,
    fileSize: value.fileSize ?? value.file_size ?? 0,
    downloadedAt: value.downloadedAt ?? value.downloaded_at ?? new Date().toISOString(),
  };
}

export const getGetCurrentUserQueryKey = () => ["auth", "me"] as const;
export const getListHistoryQueryKey = (page?: number, pageSize?: number) =>
  page && pageSize ? (["history", page, pageSize] as const) : (["history"] as const);
export const getGetDownloadStatsQueryKey = () => ["download", "stats"] as const;
export const getGetBlogPostQueryKey = (slug: string) => ["blog", "post", slug] as const;

export function useGetDownloadInfo() {
  return useMutation({
    mutationFn: async ({ data }: { data: { url: string } }) => {
      const result = await apiRequest<VideoInfo>("/api/download/info", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return result;
    },
  });
}

export function useStartDownload() {
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: { url: string; format: "mp4" | "mp3"; quality: string };
    }) => {
      const result = await apiRequest<{
        job_id?: string;
        jobId?: string;
        download_url?: string;
        downloadUrl?: string;
        filename: string;
        file_size?: number | null;
        fileSize?: number | null;
        title?: string | null;
        thumbnail?: string | null;
      }>("/api/download/start", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return normalizeDownloadStartResponse(result);
    },
  });
}

export function useGetDownloadStats() {
  return useQuery({
    queryKey: getGetDownloadStatsQueryKey(),
    queryFn: async () => {
      const data = await apiRequest<{
        total_downloads?: number;
        tiktok_downloads?: number;
        youtube_downloads?: number;
        downloads_today?: number;
        totalDownloads?: number;
        tiktokDownloads?: number;
        youtubeDownloads?: number;
        downloadsToday?: number;
      }>("/api/download/stats");
      return normalizeStats(data);
    },
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: async ({ data }: { data: { email: string; password: string } }) => {
      const result = await apiRequest<{
        access_token?: string;
        accessToken?: string;
        user: User;
      }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return normalizeTokenResponse(result);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async ({
      data,
    }: {
      data: { email: string; password: string; username?: string };
    }) => {
      const result = await apiRequest<{
        access_token?: string;
        accessToken?: string;
        user: User;
      }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return normalizeTokenResponse(result);
    },
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: async () => {
      return apiRequest<{ success: boolean }>("/api/auth/logout", {
        method: "POST",
      });
    },
  });
}

export function useGetCurrentUser() {
  return useQuery({
    queryKey: getGetCurrentUserQueryKey(),
    queryFn: async () => {
      return apiRequest<MeResponse>("/api/auth/me");
    },
  });
}

export function useListHistory(page = 1, pageSize = 20, options?: { enabled?: boolean; queryKey?: readonly unknown[] }) {
  return useQuery({
    queryKey: options?.queryKey ?? getListHistoryQueryKey(page, pageSize),
    enabled: options?.enabled,
    queryFn: async () => {
      const qs = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      const result = await apiRequest<{
        items: Array<{
          id: string;
          platform: Platform;
          original_url?: string;
          originalUrl?: string;
          video_title?: string | null;
          videoTitle?: string | null;
          thumbnail_url?: string | null;
          thumbnailUrl?: string | null;
          file_format?: "mp4" | "mp3";
          format?: "mp4" | "mp3";
          quality?: string | null;
          file_size?: number;
          fileSize?: number;
          downloaded_at?: string;
          downloadedAt?: string;
        }>;
        total: number;
        page: number;
        page_size?: number;
        pageSize?: number;
      }>(`/api/history?${qs.toString()}`);

      return {
        items: result.items.map(normalizeHistoryItem),
        total: result.total,
        page: result.page,
        pageSize: result.pageSize ?? result.page_size ?? pageSize,
      } as HistoryListResponse;
    },
  });
}

export function useDeleteHistoryItem() {
  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      return apiRequest<{ success: boolean }>(`/api/history/${id}`, {
        method: "DELETE",
      });
    },
  });
}

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "download-tiktok-without-watermark",
    title: "How to Download TikTok Videos Without Watermark",
    excerpt: "A quick guide to saving TikTok clips cleanly and safely.",
    tags: ["tiktok", "guide", "downloads"],
    publishedAt: "2026-04-01T09:00:00.000Z",
    coverImage: null,
    contentMarkdown:
      "# Download TikTok Videos Without Watermark\n\nPaste your TikTok URL, fetch info, then choose quality and format. Always respect content ownership and platform terms.",
  },
  {
    slug: "youtube-mp3-best-settings",
    title: "Best YouTube to MP3 Settings for Clear Audio",
    excerpt: "Choose bitrate and source quality that match your use case.",
    tags: ["youtube", "audio", "mp3"],
    publishedAt: "2026-04-05T10:30:00.000Z",
    coverImage: null,
    contentMarkdown:
      "# Best YouTube to MP3 Settings\n\nFor voice content, medium bitrate is often enough. For music, use higher quality where available.",
  },
  {
    slug: "safe-video-downloading-practices",
    title: "Safe Video Downloading Practices",
    excerpt: "Avoid malware and stay compliant while downloading media.",
    tags: ["security", "best-practices"],
    publishedAt: "2026-04-09T08:15:00.000Z",
    coverImage: null,
    contentMarkdown:
      "# Safe Downloading\n\nUse trusted tools, verify sources, and only download content you are permitted to use.",
  },
];

export function useListBlogPosts(
  options?: Omit<UseQueryOptions<BlogPost[], Error, BlogPost[], readonly ["blog", "list"]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: ["blog", "list"] as const,
    queryFn: async () => BLOG_POSTS,
    ...(options || {}),
  });
}

export function useGetBlogPost(
  slug: string,
  options?: Omit<UseQueryOptions<BlogPost | undefined, Error, BlogPost | undefined, readonly ["blog", "post", string]>, "queryKey" | "queryFn">,
) {
  return useQuery({
    queryKey: getGetBlogPostQueryKey(slug),
    queryFn: async () => BLOG_POSTS.find((p) => p.slug === slug),
    ...(options || {}),
  });
}
