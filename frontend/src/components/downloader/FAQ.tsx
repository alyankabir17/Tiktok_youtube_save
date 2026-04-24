import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Seo } from "@/components/seo/Seo";

const FAQS = [
  {
    q: "How do I download a TikTok video without watermark?",
    a: "Copy the TikTok video link from the share menu, paste it into VideoSave on the homepage, choose MP4, and click Download. The downloaded file has no watermark.",
  },
  {
    q: "Is it legal to download TikTok and YouTube videos?",
    a: "Downloading videos for personal use is generally fine in most countries. Re-uploading content you don't own may violate the platform's terms or copyright law. Always credit the original creator and respect their wishes.",
  },
  {
    q: "Can I download TikTok videos on iPhone or Android?",
    a: "Yes. VideoSave runs entirely in your mobile browser — no app required. Just copy the TikTok link, paste it here, and the file saves to your device.",
  },
  {
    q: "What video quality is available for download?",
    a: "TikTok videos download in their original quality, typically 1080p. YouTube videos are available in 360p, 720p, 1080p, 1440p, and 4K when the original upload supports it.",
  },
  {
    q: "How do I convert YouTube videos to MP3?",
    a: "Open the YouTube tab, paste the video URL, switch the format toggle to MP3, pick a bitrate (128 / 192 / 320 kbps), and click Download. The audio file saves directly to your device.",
  },
  {
    q: "Do I need to create an account?",
    a: "No. Downloading is free and anonymous. An optional free account lets you keep a private download history and gets you higher daily limits.",
  },
  {
    q: "Is there a limit on how many videos I can download?",
    a: "Anonymous users get 15 downloads per hour. Free signed-in accounts get 100 per hour. We use these limits to keep the service fast for everyone.",
  },
  {
    q: "How long are files stored on your servers?",
    a: "Downloaded files live on our servers for 10 minutes max so they can be streamed to you, then they're automatically deleted. We never permanently store your videos.",
  },
];

export function FAQ() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  return (
    <section className="mx-auto max-w-3xl px-4 md:px-6">
      <Seo
        title=""
        description=""
        jsonLd={jsonLd}
      />
      <div className="text-center mb-10">
        <h2 className="font-display text-3xl md:text-4xl font-bold">Frequently asked questions</h2>
        <p className="mt-3 text-muted-foreground">Everything you might wonder before you save a clip.</p>
      </div>
      <Accordion type="single" collapsible className="rounded-2xl border border-border/40 bg-card/50 backdrop-blur-md divide-y divide-border/40">
        {FAQS.map((f, i) => (
          <AccordionItem key={i} value={`q-${i}`} className="border-0 px-5">
            <AccordionTrigger className="font-display text-base text-left">
              {f.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
