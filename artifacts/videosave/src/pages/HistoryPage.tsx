import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetCurrentUser,
  useListHistory,
  useDeleteHistoryItem,
  getListHistoryQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/seo/Seo";
import { Trash2, Download, Film, Music, ExternalLink, History as HistoryIcon, Loader2 } from "lucide-react";
import { formatBytes, formatRelative } from "@/lib/utils/format";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function HistoryPage() {
  const [, navigate] = useLocation();
  const { data: meData, isLoading: meLoading } = useGetCurrentUser();
  const user = meData?.user ?? null;
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { data, isLoading } = useListHistory(
    { page, pageSize },
    { query: { enabled: !!user, queryKey: getListHistoryQueryKey({ page, pageSize }) } },
  );
  const queryClient = useQueryClient();
  const del = useDeleteHistoryItem();

  if (meLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 md:px-6 py-24 text-center">
        <Seo title="Download History — VideoSave" description="Sign in to view your download history." />
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-primary/15 text-primary mb-5">
          <HistoryIcon className="h-7 w-7" />
        </div>
        <h1 className="font-display text-3xl font-bold">Your downloads, kept tidy.</h1>
        <p className="mt-3 text-muted-foreground">
          Sign in to keep a private record of every video you've saved with VideoSave.
        </p>
        <div className="mt-6 flex gap-2 justify-center">
          <Button onClick={() => navigate("/auth/login")} variant="outline">
            Sign in
          </Button>
          <Button
            onClick={() => navigate("/auth/register")}
            className="bg-gradient-to-r from-primary to-fuchsia-500 text-white"
          >
            Create free account
          </Button>
        </div>
      </div>
    );
  }

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListHistoryQueryKey() });
      toast.success("Removed from history.");
    } catch {
      toast.error("Could not remove item.");
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-12">
      <Seo title="Download History — VideoSave" description="Your private record of saved videos." />
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl md:text-4xl font-bold">Your history</h1>
          <p className="mt-1 text-muted-foreground">{total} saved {total === 1 ? "item" : "items"}.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/"><Button variant="outline" size="sm">New TikTok</Button></Link>
          <Link href="/youtube"><Button variant="outline" size="sm">New YouTube</Button></Link>
        </div>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/60 p-12 text-center text-muted-foreground">
          Nothing saved yet. Paste a link on the homepage to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="flex items-center gap-4 rounded-xl border border-border/40 bg-card/50 backdrop-blur p-3 hover:border-border transition-colors"
            >
              <div className="relative w-20 h-20 sm:w-28 sm:h-20 shrink-0 rounded-lg bg-muted overflow-hidden">
                {it.thumbnailUrl ? (
                  <img src={it.thumbnailUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                ) : (
                  <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                    {it.format === "mp3" ? <Music className="h-5 w-5" /> : <Film className="h-5 w-5" />}
                  </div>
                )}
                <div
                  className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-bold text-white"
                  style={{ background: it.platform === "tiktok" ? "#ff0050" : "#ff0000" }}
                >
                  {it.platform}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{it.videoTitle || it.originalUrl}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
                  <span className="uppercase">{it.format}{it.quality ? ` · ${it.quality}` : ""}</span>
                  <span>{formatBytes(it.fileSize)}</span>
                  <span>{formatRelative(it.downloadedAt)}</span>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <a href={it.originalUrl} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="icon" title="Open original">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
                <Link href={it.platform === "tiktok" ? "/" : "/youtube"}>
                  <Button variant="ghost" size="icon" title="Re-download">
                    <Download className="h-4 w-4" />
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(it.id)}
                  disabled={del.isPending}
                  title="Delete"
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-muted-foreground font-mono">
            Page {page} / {pages}
          </span>
          <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
