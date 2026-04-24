import { useGetDownloadStats } from "@workspace/api-client-react";
import { formatNumber } from "@/lib/utils/format";
import { motion } from "framer-motion";

export function StatsStrip() {
  const { data } = useGetDownloadStats();
  const stats = [
    { label: "Total saves", value: formatNumber(data?.totalDownloads ?? 0) },
    { label: "TikTok", value: formatNumber(data?.tiktokDownloads ?? 0) },
    { label: "YouTube", value: formatNumber(data?.youtubeDownloads ?? 0) },
    { label: "Today", value: formatNumber(data?.downloadsToday ?? 0) },
  ];
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto"
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-border/40 bg-card/40 backdrop-blur px-4 py-3 text-center"
        >
          <div className="font-mono text-2xl font-bold tracking-tight">{s.value}</div>
          <div className="mt-0.5 text-xs uppercase tracking-wider text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </motion.div>
  );
}
