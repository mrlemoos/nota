#!/bin/sh
# Optional local / custom CI helper (full monorepo install + bundle).
# Railway production uses infra/Dockerfile.nota-server instead — Railpack leaves
# node_modules/.cache and .astro busy, so installs can fail there on Railpack.
set -eu
corepack enable pnpm
pnpm install --frozen-lockfile
cd apps/nota-server
pnpm run build
