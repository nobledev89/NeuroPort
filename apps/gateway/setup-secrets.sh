#!/usr/bin/env bash
set -euo pipefail

echo "Setting up Cloudflare Workers secrets (no keys committed)"
echo

# Export the following env vars before running, or paste interactively when prompted:
#   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY,
#   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

if [[ -n "${ANTHROPIC_API_KEY:-}" ]]; then
  printf "%s" "$ANTHROPIC_API_KEY" | npx wrangler secret put ANTHROPIC_API_KEY
else
  npx wrangler secret put ANTHROPIC_API_KEY
fi

if [[ -n "${OPENAI_API_KEY:-}" ]]; then
  printf "%s" "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
else
  npx wrangler secret put OPENAI_API_KEY
fi

if [[ -n "${GOOGLE_API_KEY:-}" ]]; then
  printf "%s" "$GOOGLE_API_KEY" | npx wrangler secret put GOOGLE_API_KEY
else
  npx wrangler secret put GOOGLE_API_KEY
fi

echo
echo "Optional (recommended) Upstash Redis credentials:"
if [[ -n "${UPSTASH_REDIS_REST_URL:-}" ]]; then
  printf "%s" "$UPSTASH_REDIS_REST_URL" | npx wrangler secret put UPSTASH_REDIS_REST_URL
else
  echo "Skipping UPSTASH_REDIS_REST_URL (not set)"
fi
if [[ -n "${UPSTASH_REDIS_REST_TOKEN:-}" ]]; then
  printf "%s" "$UPSTASH_REDIS_REST_TOKEN" | npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
else
  echo "Skipping UPSTASH_REDIS_REST_TOKEN (not set)"
fi

echo
echo "Done."

