# VideoSave Project Structure

## Overview

The repository is organized into two main folders at the root:

- `frontend/`
- `backend/`

## Directory Structure

```text
.
├── frontend/                       # UI apps
│   ├── src/                        # Main React app source
│   ├── public/                     # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── mockup-sandbox/             # UI sandbox app
│
└── backend/                        # Backend workspace (pnpm + Python)
    ├── api-server/                  # Express API server
    ├── lib/                         # Shared libraries
    │   ├── api-spec/
    │   ├── api-zod/
    │   ├── api-client-react/
    │   └── db/
    ├── scripts/                     # Utility scripts (seed, etc.)
    ├── attached_assets/             # Prompt and implementation docs
    ├── docs/                        # Project documentation
    ├── package.json
    ├── pnpm-workspace.yaml
    ├── pnpm-lock.yaml
    ├── tsconfig.base.json
    ├── tsconfig.json
    ├── pyproject.toml
    └── main.py
```

## Commands

Run all workspace-level pnpm commands from `backend/`:

```bash
cd backend
pnpm install
pnpm typecheck
pnpm build
```

Run frontend app:

```bash
cd backend
pnpm --filter @workspace/frontend run dev
```

Run backend API server:

```bash
cd backend
pnpm --filter @workspace/api-server run dev
```
