import { Seo } from "@/components/seo/Seo";
import { Downloader } from "@/components/downloader/Downloader";

export default function YouTubePage() {
  return (
    <>
      <Seo
        title="YouTube to MP4 & MP3 Downloader — Free HD — VideoSave"
        description="Convert and download YouTube videos as MP4 (up to 4K) or MP3 audio (up to 320 kbps). Fast, free, no sign-up required."
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VideoSave — YouTube Downloader",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        }}
      />
      <Downloader
        platform="youtube"
        eyebrow="YouTube downloader"
        title={
          <>
            YouTube to <span className="bg-gradient-to-r from-[#ff0000] via-orange-400 to-amber-300 bg-clip-text text-transparent">MP4 or MP3</span>, instantly.
          </>
        }
        subtitle="Save any public YouTube video in up to 4K, or pull just the audio as a 320 kbps MP3. Always free."
      />
    </>
  );
}
