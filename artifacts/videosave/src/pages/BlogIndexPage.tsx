import { Link } from "wouter";
import { useListBlogPosts } from "@workspace/api-client-react";
import { Seo } from "@/components/seo/Seo";
import { Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils/format";
import { motion } from "framer-motion";

export default function BlogIndexPage() {
  const { data, isLoading } = useListBlogPosts();
  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-12 md:py-16">
      <Seo
        title="Blog — Video Downloader Guides & Tips — VideoSave"
        description="Tutorials, guides, and tips on downloading TikTok and YouTube videos."
      />
      <div className="text-center mb-12">
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-muted-foreground">VideoSave Blog</p>
        <h1 className="mt-2 font-display text-4xl md:text-5xl font-bold">Tips, guides, and how-tos.</h1>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          Everything we've learned about saving videos the right way.
        </p>
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {(data ?? []).map((p, i) => (
            <motion.div
              key={p.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Link href={`/blog/${p.slug}`}>
                <article className="group cursor-pointer rounded-2xl border border-border/40 bg-card/50 backdrop-blur overflow-hidden hover:border-primary/40 transition-colors h-full flex flex-col">
                  <div className="aspect-[16/10] relative bg-gradient-to-br from-primary/20 via-fuchsia-500/10 to-transparent overflow-hidden">
                    {p.coverImage ? (
                      <img src={p.coverImage} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform group-hover:scale-105" />
                    ) : (
                      <div className="absolute inset-0 grid place-items-center font-display text-3xl font-bold text-primary/30 px-6 text-center leading-tight">
                        {p.title.split(" ").slice(0, 3).join(" ")}
                      </div>
                    )}
                  </div>
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {p.tags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                          {t}
                        </span>
                      ))}
                    </div>
                    <h2 className="font-display text-lg font-semibold leading-snug group-hover:text-primary transition-colors">
                      {p.title}
                    </h2>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 flex-1">{p.excerpt}</p>
                    <p className="mt-3 text-xs font-mono text-muted-foreground">{formatDate(p.publishedAt)}</p>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
