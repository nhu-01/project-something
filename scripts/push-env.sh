#!/usr/bin/env bash
# Copies the secrets from .env.local into the linked Vercel project (production). Run once: bash scripts/push-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
get() { local v; v="$(grep -E "^$1=" .env.local | head -1 | cut -d= -f2-)"; v="${v#\"}"; v="${v%\"}"; printf %s "$v"; }
for k in DATABASE_URL GEMINI_API_KEY GEMINI_MODEL; do
  v="$(get "$k")"
  [ -n "$v" ] || { echo "missing $k in .env.local"; exit 1; }
  printf %s "$v" | npx vercel@latest env add "$k" production --force >/dev/null && echo "set $k"
done
printf %s "$(openssl rand -hex 16)" | npx vercel@latest env add HASH_SALT production --force >/dev/null && echo "set HASH_SALT"
echo "done"
