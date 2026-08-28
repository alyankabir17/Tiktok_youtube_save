import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { useDownload } from "@/lib/hooks/useDownload";
import { UrlInput } from "./UrlInput";
import { VideoCard } from "./VideoCard";
import { FetchingCard } from "./FetchingCard";
import { PlatformTabs } from "./PlatformTabs";
import { StatsStrip } from "./StatsStrip";
import { HowItWorks } from "./HowItWorks";
import { FeatureComparison } from "./FeatureComparison";
import { FAQ } from "./FAQ";
import type { Platform } from "@/lib/utils/url-validator";
import { useRef } from "react";

interface Props {
  platform: Platform;
  eyebrow: string;
  title: ReactNode;
  subtitle: string;
}

export function Downloader({ platform, eyebrow, title, subtitle }: Props) {
  const dl = useDownload(platform);
  const lastUrl = useRef<string>("");

  const handleSubmit = async (url: string) => {
    lastUrl.current = url;
    await dl.fetchInfo(url);
  };

  const handleDownload = (format: "mp4" | "mp3", quality: string) => {
    if (lastUrl.current) {
      dl.startDownload(lastUrl.current, format, quality);
    }
  };

  return (
    <div className="relative">
      {/* glow blobs */}
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 overflow-hidden">
        <div
          className="absolute -top-32 left-1/2 h-[460px] w-[920px] -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
          style={{
            background:
              platform === "tiktok"
                ? "radial-gradient(circle at 30% 50%, #ff0050, transparent 60%), radial-gradient(circle at 70% 50%, #8b5cf6, transparent 60%)"
                : platform === "instagram"
                ? "radial-gradient(circle at 30% 50%, #E1306C, transparent 60%), radial-gradient(circle at 70% 50%, #F56040, transparent 60%)"
                : platform === "vimeo"
                ? "radial-gradient(circle at 30% 50%, #1ab7ea, transparent 60%), radial-gradient(circle at 70% 50%, #0f5f7a, transparent 60%)"
                : "radial-gradient(circle at 30% 50%, #ff0000, transparent 60%), radial-gradient(circle at 70% 50%, #f59e0b, transparent 60%)",
          }}
        />
      </div>

      <section className="mx-auto max-w-5xl px-4 md:px-6 pt-12 md:pt-20 pb-16 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center justify-center mb-6">
            <PlatformTabs />
          </div>
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">{eyebrow}</p>
          <h1 className="mt-3 font-display text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.05]">
            {title}
          </h1>
          <p className="mt-5 text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
        </motion.div>

        <div className="mt-10 max-w-3xl mx-auto">
          <UrlInput
            platform={platform}
            onSubmit={handleSubmit}
            loading={dl.isFetchingInfo}
            error={dl.error}
          />

          {dl.isFetchingInfo && (
            <div className="mt-6">
              <FetchingCard platform={platform} />
            </div>
          )}

          {dl.videoInfo && !dl.isFetchingInfo && (
            <div className="mt-6">
              <VideoCard
                info={dl.videoInfo}
                status={dl.status}
                progress={dl.progress}
                onDownload={handleDownload}
              />
            </div>
          )}

          <div className="mt-10">
            <StatsStrip />
          </div>
        </div>
      </section>

      <div className="space-y-24 pb-12">
        <HowItWorks />
        <FeatureComparison />
        <FAQ />
      </div>
    </div>
  );
}
