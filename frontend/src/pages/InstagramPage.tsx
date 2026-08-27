import { Seo } from "@/components/seo/Seo";
import { Downloader } from "@/components/downloader/Downloader";

export default function InstagramPage() {
  return (
    <>
      <Seo
        title="Instagram Video & Reels Downloader — Free HD MP4 — VideoSave"
        description="Download Instagram Reels, videos, and posts in high quality MP4 or extract audio as MP3. Fast, free, no sign-up required."
        canonical={typeof window !== "undefined" ? window.location.href : undefined}
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: "VideoSave — Instagram Downloader",
          applicationCategory: "MultimediaApplication",
          operatingSystem: "Any",
          offers: { "@type": "Offer", price: 0, priceCurrency: "USD" },
        }}
      />
      <Downloader
        platform="instagram"
        eyebrow="Instagram downloader"
        title={
          <>
            Instagram to{" "}
            <span className="bg-gradient-to-r from-[#f09433] via-[#dc2743] to-[#bc1888] bg-clip-text text-transparent">
              MP4 Video
            </span>
            , instantly.
          </>
        }
        subtitle="Save Instagram Reels, posts, and videos in high quality MP4 format or extract audio as MP3. Fast, secure, and free."
      />
    </>
  );
}
