import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, Eye, Heart, Clock, Music, Film, Loader2, CheckCircle2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { VideoInfo } from "@workspace/api-client-react";
import type { DownloadStatus } from "@/lib/hooks/useDownload";
import { formatDuration, formatNumber } from "@/lib/utils/format";

interface Props {
  info: VideoInfo;
  status: DownloadStatus;
  progress: number;
  onDownload: (format: "mp4" | "mp3", quality: string) => void;
}

export function VideoCard({ info, status, progress, onDownload }: Props) {
  const platform = info.platform;
  const [format, setFormat] = useState<"mp4" | "mp3">("mp4");

  const filtered = useMemo(
    () => (info.formats || []).filter((f) => f.format === format),
    [info.formats, format],
  );

  const [quality, setQuality] = useState<string>(() => {
    const list = (info.formats || []).filter((f) => f.format === "mp4");
    return list.find((f) => f.quality === "1080p")?.quality ||
           list.find((f) => f.quality === "720p")?.quality ||
           list[0]?.quality || "";
  });

  // Automatically select best HD quality whenever video info or format changes
  useEffect(() => {
    const list = (info.formats || []).filter((f) => f.format === format);
    if (list.length > 0) {
      const topQuality =
        list.find((f) => f.quality === "1080p")?.quality ||
        list.find((f) => f.quality === "720p")?.quality ||
        list.find((f) => f.quality === "320")?.quality ||
        list[0].quality;
      setQuality(topQuality);
    }
  }, [info, format]);

  const handleFormatChange = (next: "mp4" | "mp3") => {
    setFormat(next);
  };

  const accent =
    platform === "tiktok"
      ? "#ff0050"
      : platform === "instagram"
      ? "#E1306C"
      : platform === "vimeo"
      ? "#1ab7ea"
      : "#ff0000";

  const isDownloading = status === "downloading";
  const isDone = status === "done";

  // Dynamic progress stage label
  const downloadStage = useMemo(() => {
    if (progress < 25) return "Initializing media stream...";
    if (progress < 60) return `Processing & muxing ${format.toUpperCase()} high quality...`;
    if (progress < 90) return "Finalizing container package...";
    return "Saving file to your device...";
  }, [progress, format]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className={`relative overflow-hidden rounded-2xl border bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
        isDownloading
          ? "border-primary/60 shadow-primary/20 ring-2 ring-primary/20"
          : "border-border/50 shadow-black/40"
      }`}
    >
      {/* Top ambient glow on download */}
      {isDownloading && (
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-primary via-fuchsia-400 to-primary overflow-hidden">
          <motion.div
            className="h-full w-full bg-white/40"
            animate={{ x: ["-100%", "100%"] }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          />
        </div>
      )}

      <div className="grid md:grid-cols-[280px_1fr] gap-0">
        <div className="relative aspect-video md:aspect-auto md:h-full bg-muted overflow-hidden">
          {info.thumbnail ? (
            <img src={info.thumbnail} alt={info.title} className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="absolute inset-0 grid place-items-center text-muted-foreground">
              <Film className="h-10 w-10" />
            </div>
          )}
          <div
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-white shadow-md"
            style={{ background: accent }}
          >
            {platform}
          </div>
          {info.duration ? (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-md bg-black/70 text-white text-xs font-mono">
              <Clock className="h-3 w-3" />
              {formatDuration(info.duration)}
            </div>
          ) : null}
        </div>

        <div className="p-5 md:p-6 flex flex-col gap-4">
          <div>
            <h3 className="font-display text-lg md:text-xl font-bold leading-tight line-clamp-2">{info.title}</h3>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-mono">
              {info.uploader && <span>@{info.uploader}</span>}
              {info.viewCount ? (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" /> {formatNumber(info.viewCount)}
                </span>
              ) : null}
              {info.likeCount ? (
                <span className="flex items-center gap-1">
                  <Heart className="h-3 w-3" /> {formatNumber(info.likeCount)}
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleFormatChange("mp4")}
              disabled={isDownloading}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                format === "mp4"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 font-semibold"
                  : "bg-accent/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Film className="h-4 w-4" /> MP4 Video
            </button>
            <button
              onClick={() => handleFormatChange("mp3")}
              disabled={isDownloading}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                format === "mp3"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 font-semibold"
                  : "bg-accent/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Music className="h-4 w-4" /> MP3 Audio
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Select value={quality} onValueChange={setQuality} disabled={isDownloading}>
              <SelectTrigger className="h-11">
                <SelectValue placeholder="Choose quality" />
              </SelectTrigger>
              <SelectContent>
                {filtered.map((f) => (
                  <SelectItem key={f.id} value={f.quality}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => onDownload(format, quality)}
              disabled={isDownloading || !quality}
              className="h-11 min-w-[160px] relative overflow-hidden bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30 hover:opacity-90 transition-all"
            >
              <span className="relative flex items-center gap-2 font-semibold">
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {Math.round(progress)}%
                  </>
                ) : isDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4 text-emerald-300" /> Saved!
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download
                  </>
                )}
              </span>
            </Button>
          </div>

          {/* Live Downloading Progress Bar & Status Effect */}
          <AnimatePresence>
            {isDownloading && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-2 pt-2"
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="flex items-center gap-1.5 text-primary font-medium">
                    <Sparkles className="h-3.5 w-3.5 animate-spin" />
                    {downloadStage}
                  </span>
                  <span className="font-bold text-foreground">{Math.round(progress)}%</span>
                </div>

                {/* Glowing Multi-layer Progress Bar */}
                <div className="h-2.5 w-full rounded-full bg-muted/80 overflow-hidden relative shadow-inner p-[1px]">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-fuchsia-400 to-cyan-400 relative overflow-hidden"
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                  >
                    {/* Shimmer light pulse */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      animate={{ x: ["-100%", "100%"] }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
                    />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
