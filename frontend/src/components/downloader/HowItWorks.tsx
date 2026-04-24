import { motion } from "framer-motion";
import { ClipboardCheck, MousePointerClick, Download } from "lucide-react";

const STEPS = [
  {
    icon: ClipboardCheck,
    title: "Paste the link",
    body: "Copy any TikTok or YouTube URL from the share menu and paste it into the input above.",
  },
  {
    icon: MousePointerClick,
    title: "Pick quality & format",
    body: "Choose MP4 for video or MP3 for audio. Then pick the resolution or bitrate you want.",
  },
  {
    icon: Download,
    title: "Hit download",
    body: "Your file starts downloading instantly. No waiting screens, no fake buttons, no ads.",
  },
];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 md:px-6">
      <div className="text-center mb-12">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Three steps. That's it.</h2>
        <p className="mt-3 text-muted-foreground max-w-xl mx-auto">
          We built VideoSave to be the most boring downloader on the internet — in the best way possible.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {STEPS.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="relative rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md p-6 group hover:border-primary/40 transition-colors"
          >
            <div className="absolute top-4 right-5 font-mono text-5xl font-bold text-muted-foreground/15 group-hover:text-primary/30 transition-colors">
              0{i + 1}
            </div>
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary mb-4">
              <s.icon className="h-5 w-5" />
            </div>
            <h3 className="font-display text-lg font-semibold">{s.title}</h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
