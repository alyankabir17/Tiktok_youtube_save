// Generated API Schemas

export type Platform = "tiktok" | "youtube" | "vimeo";
export type Format = "mp4" | "mp3";

export interface VideoFormat {
  id: string;
  label: string;
  format: Format;
  quality: string;
}

export interface VideoInfo {
  title: string;
  thumbnail?: string | null;
  duration?: number | null;
  uploader?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  channel?: string | null;
  uploadDate?: string | null;
  description?: string | null;
  platform: Platform;
  formats: VideoFormat[];
}

export interface DownloadInfoRequest {
  url: string;
}

export interface DownloadStartRequest {
  url: string;
  format: Format;
  quality: string;
}

export interface DownloadJob {
  jobId: string;
  filename: string;
  fileSize: number;
  title?: string | null;
  thumbnail?: string | null;
  downloadUrl: string;
}

export interface User {
  id: string;
  email: string;
  username?: string | null;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface MeResponse {
  user: User | null;
}

export interface AuthResponse {
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  username?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface HistoryItem {
  id: string;
  platform: Platform;
  originalUrl: string;
  videoTitle?: string | null;
  thumbnailUrl?: string | null;
  duration?: number | null;
  format: Format;
  quality?: string | null;
  fileSize?: number | null;
  downloadedAt: string;
  status: string;
}

export interface HistoryPage {
  items: HistoryItem[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DownloadStats {
  totalDownloads: number;
  tiktokDownloads: number;
  youtubeDownloads: number;
  downloadsToday: number;
  topFormats: Array<{ format: string; count: number }>;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

export interface SuccessResponse {
  success: boolean;
}

// Blog types
export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  contentMarkdown: string;
  coverImage?: string | null;
  tags: string[];
  publishedAt: string;
}

export type BlogPostSummary = Omit<BlogPost, "contentMarkdown">;
