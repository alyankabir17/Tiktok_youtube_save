import { spawn } from "node:child_process";
import { mkdirSync, existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export const TEMP_DIR = "/tmp/videosave-downloads";

if (!existsSync(TEMP_DIR)) {
  mkdirSync(TEMP_DIR, { recursive: true });
}

export type Platform = "tiktok" | "youtube";

export function detectPlatform(url: string): Platform | null {
  if (/(?:^|\/\/)(?:www\.|m\.|vm\.)?tiktok\.com\//i.test(url)) return "tiktok";
  if (/(?:^|\/\/)(?:www\.)?(?:youtube\.com|youtu\.be)\//i.test(url)) return "youtube";
  return null;
}

interface YtDlpFormat {
  format_id?: string;
  ext?: string;
  height?: number;
  vcodec?: string;
  acodec?: string;
  filesize?: number;
}

export interface YtDlpInfo {
  title?: string;
  thumbnail?: string;
  duration?: number;
  uploader?: string;
  channel?: string;
  view_count?: number;
  like_count?: number;
  upload_date?: string;
  description?: string;
  formats?: YtDlpFormat[];
}

function runYtDlp(args: string[], timeoutMs = 60_000): Promise<{ stdout: string; stderr: string; code: number }> {
  return new Promise((resolve, reject) => {
    const child = spawn("yt-dlp", args, { stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => {
      child.kill("SIGKILL");
      reject(new Error("yt-dlp timed out"));
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d.toString()));
    child.stderr.on("data", (d) => (stderr += d.toString()));
    child.on("error", (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code: code ?? 0 });
    });
  });
}

export async function getVideoInfo(url: string): Promise<YtDlpInfo> {
  const { stdout, code, stderr } = await runYtDlp(["-J", "--no-warnings", "--no-playlist", url], 45_000);
  if (code !== 0) {
    throw new Error(stderr.split("\n").slice(-3).join(" ").trim() || "Failed to extract info");
  }
  return JSON.parse(stdout) as YtDlpInfo;
}

export interface DownloadResult {
  jobId: string;
  filePath: string;
  filename: string;
  fileSize: number;
  ext: string;
}

export async function downloadVideo(opts: {
  url: string;
  platform: Platform;
  format: "mp4" | "mp3";
  quality: string;
  title?: string;
}): Promise<DownloadResult> {
  const jobId = randomUUID();
  const outTpl = join(TEMP_DIR, `${jobId}.%(ext)s`);
  const args: string[] = ["--no-warnings", "--no-playlist", "-o", outTpl];

  if (opts.format === "mp3") {
    const bitrate = (opts.quality.replace(/\D/g, "") || "192");
    args.push("-x", "--audio-format", "mp3", "--audio-quality", bitrate + "K");
  } else {
    if (opts.platform === "tiktok") {
      args.push("-f", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best", "--merge-output-format", "mp4");
    } else {
      const heightMatch = opts.quality.match(/(\d+)/);
      const height = heightMatch ? heightMatch[1] : "1080";
      args.push(
        "-f",
        `bestvideo[height<=${height}][ext=mp4]+bestaudio[ext=m4a]/best[height<=${height}][ext=mp4]/best`,
        "--merge-output-format",
        "mp4",
      );
    }
  }
  args.push(opts.url);

  const { code, stderr } = await runYtDlp(args, 180_000);
  if (code !== 0) {
    throw new Error(stderr.split("\n").slice(-3).join(" ").trim() || "Download failed");
  }

  const files = readdirSync(TEMP_DIR).filter((f) => f.startsWith(jobId + "."));
  if (files.length === 0) {
    throw new Error("Output file not found after download");
  }
  const file = files[0]!;
  const filePath = join(TEMP_DIR, file);
  const ext = file.split(".").pop() || (opts.format === "mp3" ? "mp3" : "mp4");
  const stats = statSync(filePath);
  const safeTitle = (opts.title || `${opts.platform}-video`)
    .replace(/[^\w\s.\-]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 80) || "video";
  return {
    jobId,
    filePath,
    filename: `${safeTitle}.${ext}`,
    fileSize: stats.size,
    ext,
  };
}

export function buildFormats(info: YtDlpInfo, platform: Platform) {
  if (platform === "tiktok") {
    return [
      { id: "mp4_best", label: "MP4 — Best (no watermark)", format: "mp4" as const, quality: "best" },
      { id: "mp3_192", label: "MP3 Audio (192 kbps)", format: "mp3" as const, quality: "192" },
      { id: "mp3_320", label: "MP3 Audio (320 kbps)", format: "mp3" as const, quality: "320" },
    ];
  }
  const heights = new Set<number>();
  for (const f of info.formats ?? []) {
    if (f.vcodec && f.vcodec !== "none" && f.height) heights.add(f.height);
  }
  const allowed = [2160, 1440, 1080, 720, 480, 360];
  const videoOpts = allowed
    .filter((h) => heights.has(h))
    .map((h) => ({ id: `mp4_${h}`, label: `MP4 ${h}p`, format: "mp4" as const, quality: `${h}p` }));
  if (videoOpts.length === 0) {
    videoOpts.push({ id: "mp4_best", label: "MP4 Best", format: "mp4" as const, quality: "1080p" });
  }
  const audioOpts = [
    { id: "mp3_320", label: "MP3 Audio (320 kbps)", format: "mp3" as const, quality: "320" },
    { id: "mp3_192", label: "MP3 Audio (192 kbps)", format: "mp3" as const, quality: "192" },
    { id: "mp3_128", label: "MP3 Audio (128 kbps)", format: "mp3" as const, quality: "128" },
  ];
  return [...videoOpts, ...audioOpts];
}
