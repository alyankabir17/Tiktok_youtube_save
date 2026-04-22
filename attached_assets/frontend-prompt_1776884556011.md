# Frontend Agent Prompt — TikTok & YouTube Video Downloader
# Paste this entire prompt into Bolt.new

---

Build a complete **Next.js 14 App Router** frontend for a TikTok & YouTube video downloader web app. This is a production-ready, SEO-optimized, modern UI with dark mode.

---

## Tech Stack
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS + shadcn/ui
- **Auth**: NextAuth.js v5 (credentials + Google OAuth)
- **HTTP**: Axios with interceptors
- **State**: React hooks (no Redux needed)
- **Fonts**: Use a distinctive font pairing — NOT Inter. Use something like "Plus Jakarta Sans" + "Space Mono" or "Syne" + "DM Sans"
- **Icons**: Lucide React
- **Animation**: Framer Motion for key interactions
- **Blog**: next-mdx-remote for MDX blog posts

---

## Pages to Build

### 1. `/` — TikTok Downloader (Homepage)
- Hero section with bold headline: "Download TikTok Videos Without Watermark"
- URL input field (large, prominent, with paste button)
- Platform tabs: TikTok | YouTube (switch between pages)
- After URL submission → show video preview card with:
  - Thumbnail image
  - Video title
  - Duration
  - Format buttons: MP4 | MP3
  - Quality selector dropdown (720p, 1080p, Best)
  - Big "Download" button with loading state
- Progress bar during download
- "How it works" section (3 steps)
- FAQ accordion (min 6 questions for SEO)
- Feature comparison section ("Why choose us")

### 2. `/youtube` — YouTube Downloader
- Same layout as homepage but branded for YouTube
- Quality options: 360p, 720p, 1080p, 1440p, 4K, MP3 (128kbps, 320kbps)
- Show video metadata: channel name, view count, upload date

### 3. `/history` — Download History (requires auth)
- Protected route — redirect to login if not authenticated
- Table/grid of past downloads with:
  - Thumbnail, title, platform badge, format, file size, date
  - Re-download button
  - Delete from history button
- Pagination

### 4. `/auth/login` — Login
- Email + password form
- "Continue with Google" button
- Link to register

### 5. `/auth/register` — Register
- Username, email, password fields
- Terms acceptance checkbox

### 6. `/blog` — Blog Index
- Grid of blog post cards with thumbnail, title, excerpt, date
- SEO optimized

### 7. `/blog/[slug]` — Blog Post
- MDX rendered content
- Table of contents sidebar
- Related posts

---

## Component Architecture

### `components/downloader/UrlInput.tsx`
```typescript
interface UrlInputProps {
  onSubmit: (url: string) => void
  isLoading: boolean
  placeholder?: string
}
```
- Large input with paste-from-clipboard button
- URL validation (show error for invalid URLs)
- Auto-detect platform from URL and switch tab automatically
- Animated submit button

### `components/downloader/VideoCard.tsx`
```typescript
interface VideoCardProps {
  info: {
    title: string
    thumbnail: string
    duration: number
    platform: 'tiktok' | 'youtube'
    formats: Array<{ id: string; label: string; format: string; quality: string }>
  }
  onDownload: (format: string, quality: string) => void
  isDownloading: boolean
  progress: number
}
```
- Thumbnail with play icon overlay
- Format tabs: MP4 | MP3
- Quality dropdown (filtered by platform)
- Download button that transforms to progress bar
- File size estimate display

### `components/downloader/FormatSelector.tsx`
- Toggle between MP4 and MP3
- MP4: show quality options (360p to 4K depending on availability)
- MP3: show bitrate options (128kbps, 192kbps, 320kbps)

### `lib/api.ts`
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: 60000,
})

export const downloadAPI = {
  getInfo: (url: string) => api.post('/api/download/info', { url }),
  startDownload: (url: string, format: string, quality: string) =>
    api.post('/api/download/start', { url, format, quality }),
}
```

### `lib/hooks/useDownload.ts`
- Status: idle | fetching_info | downloading | ready | error
- Manages: videoInfo, progress (0-100), error, downloadUrl
- `fetchInfo(url)`: calls /api/download/info
- `startDownload(url, format, quality)`: calls /api/download/start, triggers browser download via anchor click

---

## Design Requirements

### Color Palette — Dark-First
```css
:root {
  --bg-primary: #0a0a0f;
  --bg-secondary: #12121a;
  --bg-card: #1a1a26;
  --accent-primary: #6c47ff;   /* Purple-blue */
  --accent-secondary: #00d4ff; /* Cyan */
  --accent-tiktok: #ff0050;    /* TikTok red */
  --accent-youtube: #ff0000;   /* YouTube red */
  --text-primary: #f0f0ff;
  --text-secondary: #8888aa;
  --border: rgba(255,255,255,0.08);
  --glass: rgba(255,255,255,0.05);
}
```

### Key Visual Details
- Glassmorphism cards with `backdrop-filter: blur`
- Gradient border on the URL input field (animated on focus)
- Floating particle/glow effect behind hero section (CSS only, no canvas)
- Hover states on all interactive elements
- Smooth transitions (200-300ms ease)
- Platform-specific color highlights (TikTok = #ff0050, YouTube = #ff0000)

---

## SEO Setup

### `app/layout.tsx` — Root metadata
```typescript
export const metadata = {
  metadataBase: new URL('https://yoursite.com'),
  title: {
    default: 'TikTok Downloader Without Watermark — Free MP4 & MP3',
    template: '%s | VideoSave'
  },
  description: 'Download TikTok videos without watermark in HD. Save YouTube videos as MP4 or MP3. Free, fast, no registration required.',
  keywords: ['tiktok downloader', 'tiktok without watermark', 'youtube to mp3', 'save tiktok video'],
  openGraph: { type: 'website', images: ['/og-image.png'] },
  robots: { index: true, follow: true },
}
```

### `app/sitemap.ts`
Auto-generate sitemap including all blog posts and static pages.

### `app/robots.txt`
```
User-agent: *
Allow: /
Sitemap: https://yoursite.com/sitemap.xml
```

---

## Folder Structure to Generate

```
frontend/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # TikTok downloader (homepage)
│   ├── youtube/page.tsx            # YouTube downloader
│   ├── history/page.tsx            # User history (auth required)
│   ├── auth/login/page.tsx
│   ├── auth/register/page.tsx
│   ├── blog/page.tsx
│   ├── blog/[slug]/page.tsx
│   ├── sitemap.ts
│   └── api/auth/[...nextauth]/route.ts
│
├── components/
│   ├── downloader/
│   │   ├── UrlInput.tsx
│   │   ├── VideoCard.tsx
│   │   ├── FormatSelector.tsx
│   │   ├── QualityPicker.tsx
│   │   ├── ProgressBar.tsx
│   │   └── PlatformTabs.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   └── Footer.tsx
│   └── seo/
│       └── SchemaMarkup.tsx
│
├── lib/
│   ├── api.ts
│   ├── auth.ts
│   └── hooks/
│       ├── useDownload.ts
│       └── useHistory.ts
│
├── content/blog/
│   ├── how-to-download-tiktok-without-watermark.mdx
│   └── youtube-to-mp3-guide.mdx
│
├── public/
│   ├── og-image.png
│   └── robots.txt
│
├── next.config.js
├── tailwind.config.ts
└── .env.local
```

---

## Environment Variables
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=generate-a-secret
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

---

## FAQs Content (for Homepage SEO)
Include these questions in an accordion:
1. How do I download a TikTok video without watermark?
2. Is it legal to download TikTok/YouTube videos?
3. Can I download TikTok videos on iPhone/Android?
4. What video quality is available for download?
5. How do I convert YouTube to MP3?
6. Do I need to create an account?
7. Is there a limit on how many videos I can download?
8. How long are files stored?

---

## Additional Notes
- Mobile-first responsive design (most users will be on phones)
- Add "Copy Link" and "Share" buttons on download result cards
- Show friendly error messages (not just "Error 500")
- When rate limited → show "Create a free account to download more" CTA
- Add a toast notification system for success/error feedback
- Implement URL validation client-side before calling API (regex for tiktok.com, youtube.com, youtu.be)
