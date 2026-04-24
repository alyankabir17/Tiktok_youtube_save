import type { ReactNode } from "react";
import { Link } from "wouter";
import { Download } from "lucide-react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
}

export function AuthShell({ title, subtitle, children }: Props) {
  return (
    <div className="mx-auto max-w-5xl px-4 md:px-6 py-10 md:py-16">
      <div className="grid md:grid-cols-2 rounded-3xl overflow-hidden border border-border/40 bg-card/40 backdrop-blur-xl shadow-2xl shadow-black/40">
        <div className="hidden md:flex relative flex-col justify-between p-8 lg:p-10 bg-gradient-to-br from-primary/30 via-fuchsia-500/20 to-transparent">
          <div className="pointer-events-none absolute inset-0 -z-10">
            <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/40 blur-[100px]" />
            <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-fuchsia-500/40 blur-[100px]" />
          </div>
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500">
              <Download className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">VideoSave</span>
          </Link>
          <div className="space-y-3">
            <h2 className="font-display text-3xl lg:text-4xl font-bold leading-tight">
              The downloader that respects your time.
            </h2>
            <p className="text-muted-foreground max-w-sm">
              Free, fast, no shady ads. Save TikToks watermark-free or pull MP3s from any YouTube link in seconds.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                ["No", "Watermark"],
                ["4K", "YouTube"],
                ["320k", "MP3"],
              ].map(([n, l]) => (
                <div key={l} className="rounded-xl border border-border/40 bg-card/40 p-3 text-center">
                  <div className="font-mono text-2xl font-bold">{n}</div>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="p-6 sm:p-10">
          <div className="md:hidden flex items-center gap-2 mb-6">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-fuchsia-500">
              <Download className="h-4 w-4 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-display text-xl font-bold">VideoSave</span>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">{title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
