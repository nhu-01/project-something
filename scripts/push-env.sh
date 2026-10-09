#!/usr/bin/env bash
# Copies the settings from .env.local into the linked Vercel project (production). Run: bash scripts/push-env.sh
set -euo pipefail
cd "$(dirname "$0")/.."
VERCEL="npx vercel@63.1.0"
get() { local v; v="$(grep -E "^$1=" .env.local | head -1 | cut -d= -f2-)"; v="${v#\"}"; v="${v%\"}"; printf %s "$v"; }
put() { printf %s "$2" | $VERCEL env add "$1" production --force >/dev/null 2>&1 || { echo "FAILED to set $1"; exit 1; }; echo "set $1"; }
for k in DATABASE_URL GEMINI_API_KEY GEMINI_MODEL; do
  v="$(get "$k")"
  [ -n "$v" ] || { echo "missing $k in .env.local"; exit 1; }
  put "$k" "$v"
done
# Only create the salt once: changing it would rename every rider and invalidate active rides.
$VERCEL env ls production 2>/dev/null | grep -q HASH_SALT || put HASH_SALT "$(openssl rand -hex 16)"
echo "done"
