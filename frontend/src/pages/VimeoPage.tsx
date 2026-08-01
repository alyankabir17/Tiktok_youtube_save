import { Seo } from "@/components/seo/Seo";
import { Downloader } from "@/components/downloader/Downloader";

export default function VimeoPage() {
  return (
    <>
      <Seo
        title="Vimeo Video Downloader — Free HD MP4 & MP3 — VideoSave"
        description="Download Vimeo videos in HD MP4 or extract audio as MP3. Fast, free, no sign-up required. Save any public Vimeo video instantly."
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VideoSave — Vimeo Downloader",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        }}
      />
      <Downloader
        platform="vimeo"
        eyebrow="Vimeo downloader"
        title={
          <>
            Vimeo to{" "}
            <span className="bg-gradient-to-r from-[#1ab7ea] via-cyan-400 to-sky-300 bg-clip-text text-transparent">
              MP4 or MP3
            </span>
            , instantly.
          </>
        }
        subtitle="Save any public Vimeo video in the highest available quality, or extract the audio as MP3. Always free, no account needed."
      />
    </>
  );
}
