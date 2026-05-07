#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL is required before deploying Prisma migrations." >&2
  exit 1
fi

npx prisma migrate deploy
