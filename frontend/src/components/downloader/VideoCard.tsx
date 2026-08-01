import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Download, Eye, Heart, Clock, Music, Film, Loader2, CheckCircle2 } from "lucide-react";
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
  const [quality, setQuality] = useState<string>(filtered[0]?.quality ?? "");

  const handleFormatChange = (next: "mp4" | "mp3") => {
    setFormat(next);
    const newOpts = (info.formats || []).filter((f) => f.format === next);
    setQuality(newOpts[0]?.quality ?? "");
  };

  const accent = platform === "tiktok" ? "#ff0050" : platform === "vimeo" ? "#1ab7ea" : "#ff0000";
  const isDownloading = status === "downloading";
  const isDone = status === "done";

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl shadow-2xl shadow-black/40"
    >
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
            className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider text-white"
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
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                format === "mp4"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-accent/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Film className="h-4 w-4" /> MP4 Video
            </button>
            <button
              onClick={() => handleFormatChange("mp3")}
              className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                format === "mp3"
                  ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30"
                  : "bg-accent/40 text-muted-foreground hover:text-foreground"
              }`}
            >
              <Music className="h-4 w-4" /> MP3 Audio
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
            <Select value={quality} onValueChange={setQuality}>
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
              className="h-11 min-w-[160px] relative overflow-hidden bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30 hover:opacity-90"
            >
              {isDownloading && (
                <motion.div
                  className="absolute inset-y-0 left-0 bg-white/15"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              )}
              <span className="relative flex items-center gap-2 font-semibold">
                {isDownloading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> {Math.round(progress)}%
                  </>
                ) : isDone ? (
                  <>
                    <CheckCircle2 className="h-4 w-4" /> Saved
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" /> Download
                  </>
                )}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
