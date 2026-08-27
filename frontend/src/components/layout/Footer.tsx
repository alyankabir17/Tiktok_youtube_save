import { Link } from "wouter";
import { Download } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background/50 mt-24">
      <div className="mx-auto max-w-7xl px-4 md:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500">
                <Download className="h-4 w-4 text-white" strokeWidth={2.5} />
              </div>
              <span className="font-display text-xl font-bold">VideoSave</span>
            </Link>
            <p className="mt-3 text-sm text-muted-foreground max-w-sm">
              The fastest way to save TikTok videos without watermark and convert YouTube to MP4 or MP3.
              No ads. No sign-up required.
            </p>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3">Tools</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground">TikTok Downloader</Link></li>
              <li><Link href="/tiktok" className="hover:text-foreground">TikTok Downloader</Link></li>
              <li><Link href="/youtube" className="hover:text-foreground">YouTube Downloader</Link></li>
              <li><Link href="/instagram" className="hover:text-foreground">Instagram Downloader</Link></li>
              <li><Link href="/vimeo" className="hover:text-foreground">Vimeo Downloader</Link></li>
              <li><Link href="/history" className="hover:text-foreground">Download History</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold mb-3">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/blog" className="hover:text-foreground">Blog</Link></li>
              <li><Link href="/auth/register" className="hover:text-foreground">Create account</Link></li>
              <li><Link href="/auth/login" className="hover:text-foreground">Sign in</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-border/40 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} VideoSave. Built for creators and casual savers.</p>
          <p className="max-w-md md:text-right">
            Please respect copyright — only download videos you own or have permission to use.
            VideoSave is not affiliated with TikTok or YouTube.
          </p>
        </div>
      </div>
    </footer>
  );
}
