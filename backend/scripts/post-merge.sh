#!/bin/bash
set -e
pnpm --dir backend install --frozen-lockfile
pnpm --dir backend --filter @workspace/db run push
