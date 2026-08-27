import { Seo } from "@/components/seo/Seo";
import { Downloader } from "@/components/downloader/Downloader";

export default function TikTokPage() {
  return (
    <>
      <Seo
        title="TikTok Video Downloader Without Watermark — Free HD — VideoSave"
        description="Download TikTok videos without watermark in HD. Free, fast, no app or sign-up required. Save TikToks as MP4 video or MP3 audio."
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VideoSave — TikTok Downloader",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
          aggregateRating: { "@type": "AggregateRating", ratingValue: 4.8, ratingCount: 1240 },
        }}
      />
      <Downloader
        platform="tiktok"
        eyebrow="TikTok downloader"
        title={
          <>
            Save TikToks <span className="bg-gradient-to-r from-[#ff0050] via-fuchsia-400 to-primary bg-clip-text text-transparent">without the watermark.</span>
          </>
        }
        subtitle="Paste any TikTok link and grab the video in HD or extract the audio as MP3. No app, no sign-up, no ads."
      />
    </>
  );
}
