import { useState, useRef, type FormEvent } from "react";
import { Clipboard, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { detectPlatform, type Platform } from "@/lib/utils/url-validator";
import { motion } from "framer-motion";

interface Props {
  platform: Platform;
  onSubmit: (url: string) => void | Promise<void>;
  loading?: boolean;
  error?: string | null;
  initialUrl?: string;
}

export function UrlInput({ platform, onSubmit, loading, error, initialUrl = "" }: Props) {
  const [, navigate] = useLocation();
  const [url, setUrl] = useState(initialUrl);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setUrl(text);
      const detected = detectPlatform(text);
      if (detected && detected !== platform) {
        if (detected === "tiktok") navigate("/tiktok");
        else if (detected === "youtube") navigate("/youtube");
        else if (detected === "instagram") navigate("/instagram");
        else navigate("/vimeo");
        return;
      }
      inputRef.current?.focus();
    } catch {
      // ignore - clipboard may be blocked
    }
  };

  const handleChange = (value: string) => {
    setUrl(value);
    const detected = detectPlatform(value);
    if (detected && detected !== platform) {
      if (detected === "tiktok") navigate("/tiktok");
      else if (detected === "youtube") navigate("/youtube");
      else if (detected === "instagram") navigate("/instagram");
      else navigate("/vimeo");
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    await onSubmit(url);
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="relative group"
      >
        <div
          className="absolute -inset-[2px] rounded-2xl opacity-60 blur-md transition-opacity duration-500 pointer-events-none"
          style={{
            background:
              platform === "tiktok"
                ? "conic-gradient(from var(--angle, 0deg), #ff0050, #8b5cf6, #06b6d4, #ff0050)"
                : platform === "instagram"
                ? "conic-gradient(from var(--angle, 0deg), #f09433, #e6683c, #dc2743, #cc2366, #bc1888, #f09433)"
                : platform === "vimeo"
                ? "conic-gradient(from var(--angle, 0deg), #1ab7ea, #0f5f7a, #06b6d4, #1ab7ea)"
                : "conic-gradient(from var(--angle, 0deg), #ff0000, #f59e0b, #8b5cf6, #ff0000)",
            opacity: focused ? 0.9 : 0.4,
          }}
        />
        <div className="relative flex items-center gap-2 rounded-2xl bg-card border border-border/50 shadow-2xl shadow-black/40 p-2">
          <input
            ref={inputRef}
            type="text"
            value={url}
            onChange={(e) => handleChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={
              platform === "tiktok"
                ? "Paste a TikTok link, e.g. https://www.tiktok.com/@user/video/..."
                : platform === "instagram"
                ? "Paste an Instagram link, e.g. https://www.instagram.com/reel/..."
                : platform === "vimeo"
                ? "Paste a Vimeo link, e.g. https://vimeo.com/123456789"
                : "Paste a YouTube link, e.g. https://youtube.com/watch?v=..."
            }
            className="flex-1 bg-transparent border-0 outline-none px-4 py-3 text-sm md:text-base placeholder:text-muted-foreground/60"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePaste}
            className="hidden sm:inline-flex shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Clipboard className="h-4 w-4 mr-1.5" />
            Paste
          </Button>
          <Button
            type="submit"
            disabled={loading || !url.trim()}
            className="shrink-0 h-11 px-5 bg-gradient-to-r from-primary to-fuchsia-500 text-white shadow-lg shadow-primary/30 hover:opacity-90"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span className="hidden sm:inline mr-2">Get video</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 flex items-center gap-2 text-sm text-destructive px-2"
        >
          <AlertCircle className="h-4 w-4" />
          {error}
        </motion.div>
      )}
    </form>
  );
}
