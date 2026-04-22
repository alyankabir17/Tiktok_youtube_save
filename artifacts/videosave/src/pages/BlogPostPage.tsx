import { Link, useRoute } from "wouter";
import {
  useGetBlogPost,
  useListBlogPosts,
  getGetBlogPostQueryKey,
} from "@workspace/api-client-react";
import { Seo } from "@/components/seo/Seo";
import { Loader2, ChevronRight, ArrowLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { formatDate } from "@/lib/utils/format";
import { TableOfContents } from "@/components/blog/TableOfContents";

export default function BlogPostPage() {
  const [, params] = useRoute("/blog/:slug");
  const slug = params?.slug ?? "";
  const { data, isLoading, error } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) },
  });
  const { data: allPosts } = useListBlogPosts();

  if (isLoading) {
    return (
      <div className="min-h-[60vh] grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="mx-auto max-w-2xl px-4 md:px-6 py-24 text-center">
        <h1 className="font-display text-3xl font-bold">Post not found</h1>
        <p className="mt-3 text-muted-foreground">It may have been moved or doesn't exist.</p>
        <Link href="/blog" className="inline-flex items-center gap-2 mt-6 text-primary font-medium">
          <ArrowLeft className="h-4 w-4" /> Back to blog
        </Link>
      </div>
    );
  }

  const related = (allPosts ?? []).filter((p) => p.slug !== data.slug).slice(0, 3);

  return (
    <div className="mx-auto max-w-6xl px-4 md:px-6 py-10 md:py-14">
      <Seo
        title={`${data.title} — VideoSave Blog`}
        description={data.excerpt}
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: data.title,
          description: data.excerpt,
          datePublished: data.publishedAt,
          author: { "@type": "Organization", name: "VideoSave" },
        }}
      />

      <nav className="flex items-center gap-1 text-sm text-muted-foreground mb-8">
        <Link href="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/blog" className="hover:text-foreground">Blog</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground truncate">{data.title}</span>
      </nav>

      <div className="grid lg:grid-cols-[1fr_220px] gap-10">
        <article className="min-w-0">
          <header className="mb-8">
            <div className="flex flex-wrap gap-1.5 mb-3">
              {data.tags.map((t) => (
                <span key={t} className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                  {t}
                </span>
              ))}
            </div>
            <h1 className="font-display text-3xl md:text-5xl font-bold tracking-tight">{data.title}</h1>
            <p className="mt-3 text-muted-foreground">{data.excerpt}</p>
            <p className="mt-4 text-xs font-mono text-muted-foreground">Published {formatDate(data.publishedAt)}</p>
          </header>

          <div className="prose prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-strong:text-foreground prose-code:text-primary max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.contentMarkdown}</ReactMarkdown>
          </div>

          {related.length > 0 && (
            <div className="mt-16 pt-10 border-t border-border/40">
              <h2 className="font-display text-2xl font-bold mb-5">Keep reading</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {related.map((p) => (
                  <Link key={p.slug} href={`/blog/${p.slug}`}>
                    <div className="rounded-xl border border-border/40 bg-card/50 backdrop-blur p-4 hover:border-primary/40 transition-colors cursor-pointer h-full">
                      <h3 className="font-display font-semibold leading-snug">{p.title}</h3>
                      <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{p.excerpt}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>

        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents markdown={data.contentMarkdown} />
          </div>
        </aside>
      </div>
    </div>
  );
}
