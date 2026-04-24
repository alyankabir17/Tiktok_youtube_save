Edited config.py
Edited main.py
Edited url_parser.py
Edited url-validator.ts
Ran command: `tree -a -I '.git|node_modules|venv|.venv|__pycache__|dist' -F`
Ran command: `find . -type f -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/venv/*" -not -path "*/__pycache__/*" -not -path "*/dist/*" -not -path "*/.venv/*" | sort`
Viewed tsconfig.json:1-22
Viewed vite.config.ts:1-32
Viewed package.json:1-80
Viewed main.py:1-53
Viewed schemas.py:1-120
Viewed download.py:1-128
Viewed url_parser.py:1-22
Viewed url-validator.ts:1-20
Listed directory lib
Viewed useDownload.ts:1-132
Viewed api.ts:1-153
Viewed custom-fetch.ts:1-41
Ran command: `find . -type d -name lib`
Ran command: `find ./lib ./frontend/src/lib -type f | sort`
Viewed utils.ts:1-7
Viewed format.ts:1-57
Viewed format-bytes.ts:1-12
Viewed index.ts:1-5
Viewed api.schemas.ts:1-123

Here is the complete, detailed analytical breakdown of your codebase format requested. You can comfortably share this with another AI context to resolve CORS issues, 422 errors, or import conflicts.

### 1. Exact Folder Structure

Here is every directory and file in the project excluding generated build folders, `__pycache__`, `node_modules`, and Python's `.venv`/`venv`:

```text
├── FINAL_STATUS.md
├── PROJECT_SUMMARY.md
├── README.md
├── RUN_PROJECT.sh
├── START_PROJECT.md
├── backend-prompt.md
├── check-setup.sh
├── package-lock.json
├── package.json
├── tsconfig.base.json
├── tsconfig.json
├── backend
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── Dockerfile
│   ├── alembic.ini
│   ├── docker-compose.yml
│   ├── main.py
│   ├── package.json
│   ├── pyproject.toml
│   ├── requirements.txt
│   ├── uv.lock
│   ├── alembic
│   │   ├── env.py
│   │   ├── script.py.mako
│   │   └── versions/001_initial.py
│   ├── api-server
│   │   ├── .replit-artifact/artifact.toml
│   │   └── tsconfig.json
│   ├── app
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── middleware
│   │   │   ├── __init__.py
│   │   │   └── rate_limiter.py
│   │   ├── models
│   │   │   ├── __init__.py
│   │   │   ├── download_history.py
│   │   │   ├── schemas.py
│   │   │   └── user.py
│   │   ├── routers
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── download.py
│   │   │   ├── health.py
│   │   │   └── history.py
│   │   ├── services
│   │   │   ├── __init__.py
│   │   │   ├── auth_service.py
│   │   │   ├── history_service.py
│   │   │   ├── tiktok.py
│   │   │   └── youtube.py
│   │   ├── tasks
│   │   │   ├── __init__.py
│   │   │   └── download_worker.py
│   │   └── utils
│   │       ├── __init__.py
│   │       ├── dependencies.py
│   │       ├── file_cleanup.py
│   │       └── url_parser.py
│   ├── docs
│   │   ├── MIGRATION_COMPLETE.md
│   │   ├── PROJECT_STRUCTURE.md
│   │   └── replit.md
│   └── scripts
│       └── post-merge.sh
├── frontend
│   ├── .env.local
│   ├── .env.local.example
│   ├── .gitignore
│   ├── .replit-artifact/artifact.toml
│   ├── components.json
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── mockup-sandbox/tsconfig.json
│   ├── public
│   │   ├── auth-side.png
│   │   ├── blog-1.png
│   │   ├── blog-2.png
│   │   ├── blog-3.png
│   │   ├── favicon.svg
│   │   ├── hero-artwork.png
│   │   └── opengraph.jpg
│   └── src
│       ├── App.tsx
│       ├── index.css
│       ├── main.tsx
│       ├── components
│       │   ├── blog/TableOfContents.tsx
│       │   ├── downloader
│       │   │   ├── Downloader.tsx
│       │   │   ├── FAQ.tsx
│       │   │   ├── FeatureComparison.tsx
│       │   │   ├── HowItWorks.tsx
│       │   │   ├── PlatformTabs.tsx
│       │   │   ├── StatsStrip.tsx
│       │   │   ├── UrlInput.tsx
│       │   │   └── VideoCard.tsx
│       │   ├── layout
│       │   │   ├── AuthShell.tsx
│       │   │   ├── Footer.tsx
│       │   │   └── Header.tsx
│       │   ├── seo/Seo.tsx
│       │   └── ui/... (Standard Radix/shadcn components)
│       ├── hooks
│       │   ├── use-mobile.tsx
│       │   └── use-toast.ts
│       ├── lib
│       │   ├── utils.ts
│       │   ├── hooks/useDownload.ts
│       │   └── utils
│       │       ├── format-bytes.ts
│       │       ├── format.ts
│       │       └── url-validator.ts
│       └── pages/...
└── lib
    ├── api-client-react
    │   ├── package-lock.json
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src
    │       ├── custom-fetch.ts
    │       ├── index.ts
    │       └── generated
    │           ├── api.schemas.ts
    │           └── api.ts
    ├── api-spec (Empty)
    ├── api-zod (Empty)
    └── db (Empty)
```

---

### 2. Breakdown of the `lib` Folders

The project architecture isolates libraries into two distinct workspaces (excluding empty folders and built-in Python VENVs): 

#### **Lib Folder A: The Frontend UI Library**
**Path**: `/home/alyan/Downloads/voice/Code-Sync/frontend/src/lib`
* **What it is**: Part of the React source tree encapsulating frontend-only business logic.
* **Files inside**:
  * `frontend/src/lib/utils.ts` 👉 Runs Tailwind class merging (`clsx` + `twMerge`).
  * `frontend/src/lib/hooks/useDownload.ts` 👉 Houses the main `useDownload` custom hook handling React state variables, timeouts, intervals, and mutations.
  * `frontend/src/lib/utils/format.ts` 👉 Helpers to parse generic text formats (`formatDuration`, `formatNumber`, date parsing).
  * `frontend/src/lib/utils/format-bytes.ts` 👉 Specific helper parsing integers array to readable file byte sizes.
  * `frontend/src/lib/utils/url-validator.ts` 👉 Frontend URL validation using regex tests for tiktok/youtube inputs.
* **Imports**: This layer imports *downwards* from `Lib Folder B` via `@workspace/api-client-react` (specifically in `useDownload.ts`). 

#### **Lib Folder B: The API Client Library (NPM Monorepo Package)**
**Path**: `/home/alyan/Downloads/voice/Code-Sync/lib/api-client-react`
* **What it is**: A shared workspace dependency managing all typed communications with the backend. 
* **Files inside**:
  * `lib/api-client-react/src/custom-fetch.ts` 👉 Contains the generic `fetch` API request wrapper configuring the headers and base URLs.
  * `lib/api-client-react/src/generated/api.schemas.ts` 👉 Fully generated TypeScript interfaces corresponding to Pydantic schemas over in the backend. 
  * `lib/api-client-react/src/generated/api.ts` 👉 Exports TanStack React Query Hooks like `useGetDownloadInfo()` wrapping the fetch call with query keys. 
  * `lib/api-client-react/src/index.ts` 👉 Rollup of module exports.
* **Imports**: This library imports nothing externally and is strictly independent. 

---

### 3. Frontend Architecture

**Framework**: Formally running React 19 orchestrated by Vite, bundled with Tailwind CSS v4 and written in Typescript. Uses NPM Workspaces to natively resolve local packages.

* **Import Resoution**:
  * Imports starting with `@/` resolve directly to `frontend/src/` through Vite path mapping and TS compiler.
  * Imports starting with `@workspace/api-client-react` are captured by NPM workspaces directly pointing `package.json` to `"file:../lib/api-client-react"`.

**`frontend/tsconfig.json`**:
```json
{
  "include": ["src/**/*", "vite.config.ts"],
  "exclude": ["node_modules", "build", "dist", "**/*.test.ts"],
  "compilerOptions": {
    "target": "es2022",
    "lib": ["esnext", "dom", "dom.iterable"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "noEmit": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "allowImportingTsExtensions": true,
    "types": ["node", "vite/client"],
    "strict": true,
    "skipLibCheck": true,
    "isolatedModules": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**`frontend/vite.config.ts`**:
```typescript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    dedupe: ["react", "react-dom"],
  },
  root: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist"),
    emptyOutDir: true,
  },
  server: {
    port: 3001,
    strictPort: true,
    host: "0.0.0.0",
  },
  preview: {
    port: 3001,
    host: "0.0.0.0",
  },
});
```

**`frontend/package.json`**:
```json
{
  "name": "@workspace/frontend",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --config vite.config.ts --host 0.0.0.0",
    "build": "vite build --config vite.config.ts",
    "serve": "vite preview --config vite.config.ts --host 0.0.0.0",
    "typecheck": "tsc -p tsconfig.json --noEmit"
  },
  "dependencies": {
    "react-markdown": "^10.1.0",
    "remark-gfm": "^4.0.1"
  },
  "devDependencies": {
... <Truncated hundreds of Radix UI dependencies> ...
    "@tailwindcss/vite": "^4.1.14",
    "@tanstack/react-query": "^5.90.21",
    "@types/node": "^22.0.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@workspace/api-client-react": "file:../lib/api-client-react",
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-hook-form": "^7.55.0",
    "tailwindcss": "^4.1.14",
    "typescript": "^5.9.3",
    "vite": "^5.4.19"
  }
}
```

---

### 4. Backend Source Code
*(Showing the exact layout that governs the backend schema generation and endpoints.)*

**`backend/app/main.py`**:
```python
from fastapi import FastAPI, HTTPException, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers import auth, download, health, history

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url=None,
)

@app.exception_handler(HTTPException)
async def http_exception_handler(_: Request, exc: HTTPException) -> JSONResponse:
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    if isinstance(exc.detail, dict):
        message = str(exc.detail.get("message") or message)
    return JSONResponse(status_code=exc.status_code, content={"message": message})

@app.exception_handler(RequestValidationError)
async def request_validation_exception_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    first = exc.errors()[0] if exc.errors() else None
    message = "Invalid request"
    if first:
        message = str(first.get("msg") or message)
    return JSONResponse(status_code=422, content={"message": message})

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",  # Add your dev port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(health.router)
app.include_router(auth.router)
app.include_router(download.router)
app.include_router(history.router)
```

**`backend/app/models/schemas.py`**:
*(Excerpting the directly relevant structs mapped to Video Info)*
```python
import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, field_validator

class DownloadInfoRequest(BaseModel):
    url: str

    @field_validator("url")
    @classmethod
    def validate_url(cls, value: str) -> str:
        if not ("tiktok.com" in value or "youtube.com" in value or "youtu.be" in value):
            raise ValueError("Only TikTok and YouTube URLs are supported")
        return value.strip()

class FormatOption(BaseModel):
    id: str
    label: str
    format: str
    quality: str

class VideoInfoResponse(BaseModel):
    title: str
    thumbnail: str | None = None
    duration: int | None = None
    platform: str
    formats: list[FormatOption]
    uploader: str | None = None
    view_count: int | None = Field(default=None, alias="viewCount")

    model_config = ConfigDict(populate_by_name=True)

class DownloadStartRequest(BaseModel):
    url: str
    format: str
    quality: str

    @field_validator("format")
    @classmethod
    def validate_format(cls, value: str) -> str:
        if value not in {"mp4", "mp3"}:
            raise ValueError("Format must be mp4 or mp3")
        return value
```

**`backend/app/routers/download.py`**:
```python
import os
import uuid
from urllib.parse import quote
from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
# ... Internal package imports

router = APIRouter(prefix="/api/download", tags=["download"])

@router.post("/info", response_model=VideoInfoResponse, dependencies=[Depends(check_rate_limit)])
async def get_video_info(payload: DownloadInfoRequest) -> VideoInfoResponse:
    platform = detect_platform(payload.url)
    if not platform:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL. Only TikTok and YouTube URLs are supported.",
        )

    try:
        if platform == "tiktok":
            info = await get_tiktok_info(payload.url)
        else:
            info = await get_youtube_info(payload.url)
        return VideoInfoResponse.model_validate(info)
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail=f"Could not fetch video info: {exc}") from exc

@router.post("/start", response_model=DownloadStartResponse, dependencies=[Depends(check_rate_limit)])
async def start_download(
    payload: DownloadStartRequest,
    request: Request,
    db: AsyncSession = Depends(get_db),
    user: User | None = Depends(get_optional_current_user),
) -> DownloadStartResponse:
    platform = detect_platform(payload.url)
    if not platform:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsupported URL")

    try:
        if platform == "tiktok":
            result = await download_tiktok(payload.url, payload.format, payload.quality)
        else:
            result = await download_youtube(payload.url, payload.format, payload.quality)
# ... File Cleanup Logic and Handlers 
```

**`backend/app/utils/url_parser.py`**:
*(Note: As observed from your active workspace editing session, regex arrays were removed in favor of basic string matching)*
```python
import re
from typing import Literal

Platform = Literal["tiktok", "youtube"]

def detect_platform(url: str) -> Platform | None:
    candidate = url.strip()

    if "tiktok.com" in candidate:
        return "tiktok"

    if "youtube.com" in candidate or "youtu.be" in candidate:
        return "youtube"

    return None
```

---

### 5. API Client Fetch Logistics

The exact structure of a frontend fetch moving to the backend:

**Inside `frontend/src/lib/hooks/useDownload.ts`:**
The hook uses the mutation mapping payload parameters inside the `data` wrapper property.
```typescript
    const infoMutation = useGetDownloadInfo();
    
    // ...
    const fetchInfo = useCallback(
    async (url: string) => {
      const trimmed = url.trim();
      // ... Validation logic ...
      try {
        setStatus("fetching_info");
        // *** THE PRECISE PAYLOAD INJECTED ***
        const info = await infoMutation.mutateAsync({ data: { url: trimmed } });
        setVideoInfo(info);
        setStatus("ready");
```

**Inside `lib/api-client-react/src/generated/api.ts`**:
The generated hook translates the `data` parameter into standard JSON formatting via `DownloadInfoRequest` schema.
```typescript
export function useGetDownloadInfo(
  options?: UseMutationOptions<schemas.VideoInfo, Error, { data: schemas.DownloadInfoRequest }>
) {
  return useMutation({
    mutationFn: async ({ data }: { data: schemas.DownloadInfoRequest }) =>
      customFetch<schemas.VideoInfo>("/api/download/info", {
        method: "POST",
        body: JSON.stringify(data), // Exact JSON body stringified
      }),
    ...options,
  });
}
```

**Inside `lib/api-client-react/src/custom-fetch.ts`:**
Handles constructing headers and hitting the native `fetch()`. Wait, check out **Line 1**! The baseUrl is hardcoded statically to port 8000.
```typescript
let baseUrl = "http://localhost:8000"; // <--- Hardcoded target!
let authTokenGetter: AuthTokenGetter | null = null;

export async function customFetch<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = authTokenGetter ? await authTokenGetter() : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  
  const response = await fetch(`${baseUrl}${url}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }
  return response.json();
}
```

---

### 6. Validation Logic Overview

The code relies purely on substring injection mapping, without strict URI component parsing or rigorous regular expressions.

**`frontend/src/lib/utils/url-validator.ts`**:
```typescript
export type Platform = "tiktok" | "youtube";

export function isTiktokUrl(url: string): boolean {
  return url.trim().includes('tiktok.com')
}

export function isYoutubeUrl(url: string): boolean {
  const u = url.trim()
  return u.includes('youtube.com') || u.includes('youtu.be')
}

export function detectPlatform(url: string): Platform | null {
  if (isTiktokUrl(url)) return "tiktok"
  if (isYoutubeUrl(url)) return "youtube"
  return null
}

export function isValidUrl(url: string): boolean {
  return isTiktokUrl(url) || isYoutubeUrl(url)
}
```

*(You can see that there is no formal HTTP regex here, so strings like `tiktok.com` thrown raw into the form bypass frontend validation but might subsequently blow up in the backend Pydantic validation if it expects formal `https://` schemas, resulting in your 422 Unprocessable Entity errors.)*