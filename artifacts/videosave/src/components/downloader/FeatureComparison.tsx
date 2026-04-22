import { Check, X } from "lucide-react";
import { motion } from "framer-motion";

const ROWS = [
  ["No watermark", true, false],
  ["HD quality (1080p+)", true, false],
  ["MP3 audio extraction", true, true],
  ["Zero ads or pop-ups", true, false],
  ["No app required", true, true],
  ["No sign-up to download", true, false],
  ["Free download history", true, false],
  ["Files auto-deleted from server", true, false],
] as const;

export function FeatureComparison() {
  return (
    <section className="mx-auto max-w-5xl px-4 md:px-6">
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Why pick VideoSave?</h2>
        <p className="mt-3 text-muted-foreground">An honest comparison with most other downloader sites.</p>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md"
      >
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/40 bg-accent/30">
              <th className="text-left px-4 md:px-6 py-4 font-display text-base">Feature</th>
              <th className="px-4 md:px-6 py-4 font-display text-base">
                <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">VideoSave</span>
              </th>
              <th className="px-4 md:px-6 py-4 font-display text-base text-muted-foreground">Most sites</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([label, ours, theirs]) => (
              <tr key={label} className="border-b border-border/30 last:border-0 hover:bg-accent/20">
                <td className="px-4 md:px-6 py-3.5">{label}</td>
                <td className="px-4 md:px-6 py-3.5 text-center">
                  {ours ? (
                    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-primary/15 text-primary">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-destructive/10 text-destructive">
                      <X className="h-4 w-4" />
                    </span>
                  )}
                </td>
                <td className="px-4 md:px-6 py-3.5 text-center">
                  {theirs ? (
                    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground">
                      <Check className="h-4 w-4" />
                    </span>
                  ) : (
                    <span className="inline-grid h-7 w-7 place-items-center rounded-full bg-muted text-muted-foreground">
                      <X className="h-4 w-4" />
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </section>
  );
}
