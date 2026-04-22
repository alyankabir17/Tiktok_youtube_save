import { Router, type IRouter } from "express";
import { createReadStream, existsSync } from "node:fs";
import { GetDownloadInfoBody, StartDownloadBody } from "@workspace/api-zod";
import { db, downloadHistoryTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  buildFormats,
  detectPlatform,
  downloadVideo,
  getVideoInfo,
} from "../lib/ytdlp";
import { rateLimit } from "../lib/rateLimit";
import { registerJob, getJob, clearJob } from "../lib/files";

const router: IRouter = Router();

router.post("/download/info", rateLimit({ anonLimit: 30, authedLimit: 200 }), async (req, res) => {
  const parsed = GetDownloadInfoBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "URL is required." });
  }
  const platform = detectPlatform(parsed.data.url);
  if (!platform) {
    return res.status(400).json({
      error: "UNSUPPORTED_URL",
      message: "Only TikTok and YouTube URLs are supported.",
    });
  }
  try {
    const info = await getVideoInfo(parsed.data.url);
    return res.json({
      title: info.title || (platform === "tiktok" ? "TikTok Video" : "YouTube Video"),
      thumbnail: info.thumbnail ?? null,
      duration: info.duration ?? null,
      uploader: info.uploader ?? null,
      viewCount: info.view_count ?? null,
      likeCount: info.like_count ?? null,
      channel: info.channel ?? info.uploader ?? null,
      uploadDate: info.upload_date ?? null,
      description: info.description ? info.description.slice(0, 500) : null,
      platform,
      formats: buildFormats(info, platform),
    });
  } catch (err) {
    req.log.error({ err }, "info extract failed");
    return res
      .status(422)
      .json({ error: "EXTRACTION_FAILED", message: "Could not fetch video info. The link may be private or unsupported." });
  }
});

router.post("/download/start", rateLimit({ anonLimit: 15, authedLimit: 100 }), async (req, res) => {
  const parsed = StartDownloadBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "url, format, and quality are required." });
  }
  const { url, format, quality } = parsed.data;
  const platform = detectPlatform(url);
  if (!platform) {
    return res.status(400).json({ error: "UNSUPPORTED_URL", message: "Only TikTok and YouTube URLs are supported." });
  }

  let title: string | undefined;
  let thumbnail: string | null = null;
  let duration: number | null = null;
  try {
    const info = await getVideoInfo(url);
    title = info.title;
    thumbnail = info.thumbnail ?? null;
    duration = info.duration ?? null;
  } catch (err) {
    req.log.warn({ err }, "info-before-download failed; continuing");
  }

  try {
    const result = await downloadVideo({ url, platform, format, quality, title });
    registerJob(result.jobId, {
      filePath: result.filePath,
      filename: result.filename,
      contentType: result.ext === "mp3" ? "audio/mpeg" : "video/mp4",
      fileSize: result.fileSize,
      createdAt: Date.now(),
    });

    if (req.session.userId) {
      try {
        await db.insert(downloadHistoryTable).values({
          userId: req.session.userId,
          platform,
          originalUrl: url,
          videoTitle: title ?? null,
          thumbnailUrl: thumbnail,
          duration,
          format,
          quality,
          fileSize: result.fileSize,
          ipAddress: req.ip ?? null,
          status: "completed",
        });
      } catch (err) {
        req.log.warn({ err }, "failed to save history");
      }
    }

    const base = process.env["BASE_PATH"] || "";
    const downloadUrl = `${base.replace(/\/$/, "")}/api/download/file/${result.jobId}`;
    return res.json({
      jobId: result.jobId,
      filename: result.filename,
      fileSize: result.fileSize,
      title: title ?? null,
      thumbnail,
      downloadUrl,
    });
  } catch (err) {
    req.log.error({ err }, "download failed");
    return res
      .status(500)
      .json({ error: "DOWNLOAD_FAILED", message: "We couldn't fetch that video. Try a different link or quality." });
  }
});

router.get("/download/file/:jobId", (req, res) => {
  const jobId = req.params["jobId"];
  if (!jobId || !/^[a-f0-9-]+$/i.test(jobId)) {
    return res.status(400).json({ error: "BAD_REQUEST", message: "Invalid job id." });
  }
  const job = getJob(jobId);
  if (!job || !existsSync(job.filePath)) {
    return res.status(404).json({ error: "NOT_FOUND", message: "Download has expired. Please try again." });
  }
  res.setHeader("Content-Type", job.contentType);
  res.setHeader("Content-Length", job.fileSize.toString());
  res.setHeader("Content-Disposition", `attachment; filename="${job.filename}"`);
  const stream = createReadStream(job.filePath);
  stream.on("error", (err) => {
    req.log.error({ err }, "stream error");
    if (!res.headersSent) res.status(500).end();
  });
  stream.on("end", () => {
    setTimeout(() => clearJob(jobId), 30 * 1000);
  });
  return stream.pipe(res);
});

router.get("/download/stats", async (_req, res) => {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const totals = await db.execute<{
    total: number;
    tiktok: number;
    youtube: number;
    today: number;
  }>(sql`
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE platform = 'tiktok')::int AS tiktok,
      COUNT(*) FILTER (WHERE platform = 'youtube')::int AS youtube,
      COUNT(*) FILTER (WHERE downloaded_at >= ${todayStart.toISOString()})::int AS today
    FROM download_history
  `);

  const formats = await db.execute<{ format: string; count: number }>(sql`
    SELECT format, COUNT(*)::int AS count
    FROM download_history
    GROUP BY format
    ORDER BY count DESC
    LIMIT 5
  `);

  const row = totals.rows[0] ?? { total: 0, tiktok: 0, youtube: 0, today: 0 };
  return res.json({
    totalDownloads: row.total,
    tiktokDownloads: row.tiktok,
    youtubeDownloads: row.youtube,
    downloadsToday: row.today,
    topFormats: formats.rows.map((r) => ({ format: r.format, count: r.count })),
  });
});

export default router;
