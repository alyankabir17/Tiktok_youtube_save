# VideoSave

A free TikTok and YouTube video downloader web app. Paste a link, pick a quality, get a clean file — TikToks come without the watermark, YouTube can be saved as MP4 (up to 4K) or MP3 (up to 320 kbps).

## Architecture

This project is organized into two top-level folders:

- **`frontend/`** — React + Vite + Tailwind frontend and a `mockup-sandbox` app.
- **`backend/`** — Backend workspace containing API server, shared libraries, scripts, and Python tooling.

Shared libraries live in `backend/lib/`:

- **`lib/api-spec`** — OpenAPI 3.1 source of truth (`openapi.yaml`).
- **`lib/api-zod`** — Zod schemas generated from the spec, used by the backend for request validation.
- **`lib/api-client-react`** — TanStack Query hooks generated from the spec, consumed by the frontend.
- **`lib/db`** — Drizzle schema + Postgres pool. Tables: `users`, `download_history`, `blog_posts`, `session`.

Run `pnpm --dir backend --filter @workspace/api-spec run codegen` after editing the OpenAPI file to regenerate the zod and client packages.

## Features

- **TikTok & YouTube downloader pages** — paste-URL flow with auto platform detection, fake-progress bar, format toggle (MP4 / MP3), quality picker.
- **Auth** — email + password using bcrypt, sessions stored in Postgres via `connect-pg-simple`.
- **Download history** — per-user, paginated, with re-download and delete actions.
- **Blog** — markdown posts (`react-markdown` + `remark-gfm`), table-of-contents sidebar, related posts, breadcrumbs, JSON-LD `BlogPosting` schema.
- **SEO** — per-page `<title>`, OG tags, canonical, JSON-LD (`SoftwareApplication`, `FAQPage`, `BlogPosting`).
- **Rate limiting** — 15/hr anonymous, 100/hr signed in.
- **File handling** — yt-dlp downloads to `/tmp/videosave-downloads`, served by streaming endpoint, auto-deleted after 10 minutes.

## Stack notes

- Theme: dark by default via `next-themes` (no system toggle exposed yet).
- Fonts: Plus Jakarta Sans (body) + Syne (display) + Space Mono (numeric/UI accents) — loaded from Google Fonts in `index.html`.
- Toasts via `sonner`. Routing via `wouter` honoring `import.meta.env.BASE_URL`.
- All API requests go through the proxy at `/api/*`.

## Required env vars

- `DATABASE_URL` — provisioned Postgres.
- `SESSION_SECRET` — used by `express-session`.

## Local commands

- `pnpm --dir backend --filter @workspace/db run push --force` — apply schema changes to DB.
- `pnpm --dir backend --filter @workspace/scripts run seed` — seed the 4 starter blog posts.
- `pnpm --dir backend --filter @workspace/frontend run typecheck` — type-check the frontend.
- `pnpm --dir backend --filter @workspace/api-server run typecheck` — type-check the backend.

## System dependencies

- `yt-dlp` (Python) — video extraction.
- `ffmpeg` — used by yt-dlp for muxing and audio conversion.
