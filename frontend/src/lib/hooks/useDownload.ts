import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDownloadInfo,
  useStartDownload,
  fetchDownloadProgress,
  type DownloadProgress,
  getListHistoryQueryKey,
  getGetDownloadStatsQueryKey,
} from "@workspace/api-client-react";
import type { VideoInfo } from "@workspace/api-client-react";
import { detectPlatform, isValidUrl, type Platform } from "@/lib/utils/url-validator";

export type DownloadStatus = "idle" | "fetching_info" | "ready" | "downloading" | "done" | "error";

export interface DownloadMetrics {
  percent: number;
  speed: string;
  eta: string;
  downloaded: string;
  total: string;
  stage: string;
}

export function useDownload(expectedPlatform?: Platform) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [metrics, setMetrics] = useState<DownloadMetrics>({
    percent: 0,
    speed: "--",
    eta: "--",
    downloaded: "0 B",
    total: "--",
    stage: "Initializing stream...",
  });
  const [error, setError] = useState<string | null>(null);
  const pollTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const infoMutation = useGetDownloadInfo();
  const startMutation = useStartDownload();

  useEffect(() => {
    return () => {
      if (pollTimer.current) clearInterval(pollTimer.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (pollTimer.current) clearInterval(pollTimer.current);
    setStatus("idle");
    setVideoInfo(null);
    setProgress(0);
    setMetrics({
      percent: 0,
      speed: "--",
      eta: "--",
      downloaded: "0 B",
      total: "--",
      stage: "Initializing stream...",
    });
    setError(null);
  }, []);

  const fetchInfo = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      setError(null);
      if (!trimmed) {
        setError("Please paste a video link.");
        return;
      }
      if (!isValidUrl(trimmed)) {
        setError("That doesn't look like a valid URL.");
        return;
      }
      const platform = detectPlatform(trimmed);
      if (!platform) {
        setError("Only TikTok, YouTube, Instagram, and Vimeo links are supported.");
        return;
      }
      if (expectedPlatform && platform !== expectedPlatform) {
        const platformName =
          platform === "tiktok"
            ? "TikTok"
            : platform === "youtube"
            ? "YouTube"
            : platform === "instagram"
            ? "Instagram"
            : "Vimeo";
        setError(`That looks like a ${platformName} link.`);
        return;
      }
      try {
        setStatus("fetching_info");
        const info = await infoMutation.mutateAsync({ data: { url: trimmed } });
        setVideoInfo(info);
        setStatus("ready");
      } catch (e) {
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Could not load video info. Try a different link.";
        setError(msg);
        setStatus("error");
        toast.error(msg);
      }
    },
    [expectedPlatform, infoMutation],
  );

  const startDownload = useCallback(
    async (url: string, format: "mp4" | "mp3", quality: string) => {
      setError(null);
      setProgress(2);
      setStatus("downloading");
      
      const jobId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `job-${Date.now()}`;
      
      setMetrics({
        percent: 2,
        speed: "--",
        eta: "--",
        downloaded: "0 B",
        total: "Calculating...",
        stage: "Connecting to media stream...",
      });

      if (pollTimer.current) clearInterval(pollTimer.current);

      // Live Telemetry Poller
      pollTimer.current = setInterval(async () => {
        try {
          const prog: DownloadProgress = await fetchDownloadProgress(jobId);
          if (prog) {
            setMetrics({
              percent: prog.percent,
              speed: prog.speed,
              eta: prog.eta,
              downloaded: prog.downloaded,
              total: prog.total,
              stage: prog.stage,
            });
            if (prog.percent > 0) {
              setProgress(prog.percent);
            }
          }
        } catch {
          // Ignore network glitch on poll
        }
      }, 300);

      try {
        const job = await startMutation.mutateAsync({
          data: { url, format, quality, jobId },
        });

        if (pollTimer.current) clearInterval(pollTimer.current);
        setProgress(100);
        setMetrics((m) => ({ ...m, percent: 100, stage: "Download ready!" }));

        const a = document.createElement("a");
        a.href = job.downloadUrl;
        a.download = job.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();

        setStatus("done");
        toast.success("Download started.", { description: job.filename });
        queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetDownloadStatsQueryKey() });
      } catch (e) {
        if (pollTimer.current) clearInterval(pollTimer.current);
        const msg =
          (e as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Download failed. Please try a different link or quality.";
        setError(msg);
        setStatus("error");
        setProgress(0);
        toast.error(msg);
      }
    },
    [queryClient, startMutation],
  );

  return {
    status,
    videoInfo,
    progress,
    metrics,
    error,
    fetchInfo,
    startDownload,
    reset,
    isFetchingInfo: infoMutation.isPending,
  };
}
