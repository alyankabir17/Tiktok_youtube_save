import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Radio, Zap, ShieldCheck } from "lucide-react";
import type { Platform } from "@/lib/utils/url-validator";

interface Props {
  platform: Platform;
}

const STEPS = [
  "Connecting to server...",
  "Bypassing restrictions & resolving stream...",
  "Extracting highest resolution formats...",
  "Preparing HD audio and video...",
];

export function FetchingCard({ platform }: Props) {
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((prev) => (prev + 1) % STEPS.length);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  const accentGradient =
    platform === "tiktok"
      ? "from-[#ff0050] via-fuchsia-500 to-purple-600"
      : platform === "instagram"
      ? "from-[#f09433] via-[#dc2743] to-[#bc1888]"
      : platform === "vimeo"
      ? "from-[#1ab7ea] via-cyan-400 to-blue-600"
      : "from-[#ff0000] via-amber-500 to-red-600";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.98 }}
      transition={{ duration: 0.3 }}
      className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/70 backdrop-blur-xl p-6 shadow-2xl shadow-black/50"
    >
      {/* Animated top shimmer beam */}
      <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
        <motion.div
          className={`h-full w-1/2 bg-gradient-to-r ${accentGradient}`}
          animate={{ x: ["-100%", "200%"] }}
          transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
        />
      </div>

      <div className="grid md:grid-cols-[180px_1fr] gap-6 items-center">
        {/* Animated Scanner Preview */}
        <div className="relative aspect-video md:aspect-square w-full rounded-xl bg-muted/60 border border-border/40 overflow-hidden flex items-center justify-center">
          {/* Radar ripple waves */}
          <motion.div
            className={`absolute rounded-full border-2 border-primary/40`}
            animate={{ width: ["0%", "150%"], height: ["0%", "150%"], opacity: [0.8, 0] }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
          />
          <motion.div
            className={`absolute rounded-full border border-primary/30`}
            animate={{ width: ["0%", "150%"], height: ["0%", "150%"], opacity: [0.6, 0] }}
            transition={{ repeat: Infinity, duration: 2, delay: 0.7, ease: "easeOut" }}
          />

          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${accentGradient} shadow-lg shadow-primary/30 text-white z-10`}
          >
            <Radio className="h-6 w-6 animate-pulse" />
          </motion.div>

          {/* Scanning line */}
          <motion.div
            className="absolute left-0 right-0 h-[1px] bg-white/60 shadow-[0_0_8px_rgba(255,255,255,0.8)] z-20"
            animate={{ top: ["0%", "100%", "0%"] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
          />
        </div>

        {/* Status Content */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
            </span>
            <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              Fetching Media Details
            </span>
          </div>

          <div className="h-7 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={stepIndex}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex items-center gap-2 text-base md:text-lg font-semibold text-foreground"
              >
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span>{STEPS[stepIndex]}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Skeleton lines with shimmer effect */}
          <div className="space-y-2 pt-1">
            <div className="h-3 w-3/4 rounded-full bg-muted/80 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              />
            </div>
            <div className="h-3 w-1/2 rounded-full bg-muted/60 relative overflow-hidden">
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{ x: ["-100%", "100%"] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: 0.2, ease: "easeInOut" }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
            <span className="flex items-center gap-1">
              <Zap className="h-3.5 w-3.5 text-amber-400" /> High-speed stream
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Safe & virus-free
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
