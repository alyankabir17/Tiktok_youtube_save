import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDownloadInfo,
  useStartDownload,
  getListHistoryQueryKey,
  getGetDownloadStatsQueryKey,
} from "@workspace/api-client-react";
import type { VideoInfo } from "@workspace/api-client-react";
import { detectPlatform, isValidUrl, type Platform } from "@/lib/utils/url-validator";

export type DownloadStatus = "idle" | "fetching_info" | "ready" | "downloading" | "done" | "error";

export function useDownload(expectedPlatform?: Platform) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<DownloadStatus>("idle");
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const infoMutation = useGetDownloadInfo();
  const startMutation = useStartDownload();

  useEffect(() => {
    return () => {
      if (progressTimer.current) clearInterval(progressTimer.current);
    };
  }, []);

  const reset = useCallback(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);
    setStatus("idle");
    setVideoInfo(null);
    setProgress(0);
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
      if (progressTimer.current) clearInterval(progressTimer.current);
      progressTimer.current = setInterval(() => {
        setProgress((p) => {
          if (p >= 90) return p;
          const inc = p < 50 ? 4 : p < 75 ? 2 : 1;
          return Math.min(90, p + inc);
        });
      }, 350);
      try {
        const job = await startMutation.mutateAsync({
          data: { url, format, quality },
        });
        if (progressTimer.current) clearInterval(progressTimer.current);
        setProgress(100);
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
        if (progressTimer.current) clearInterval(progressTimer.current);
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
    error,
    fetchInfo,
    startDownload,
    reset,
    isFetchingInfo: infoMutation.isPending,
  };
}
