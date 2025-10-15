@echo off
REM Cloudflare Workers secrets setup (no keys committed)
REM Usage: set env vars before running, or paste interactively when prompted
REM   ANTHROPIC_API_KEY, OPENAI_API_KEY, GOOGLE_API_KEY,
REM   UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN

setlocal enableextensions enabledelayedexpansion

echo Setting up Cloudflare Workers secrets (no keys committed)
echo.

if defined ANTHROPIC_API_KEY (
  echo %ANTHROPIC_API_KEY% | npx wrangler secret put ANTHROPIC_API_KEY
) else (
  npx wrangler secret put ANTHROPIC_API_KEY
)

if defined OPENAI_API_KEY (
  echo %OPENAI_API_KEY% | npx wrangler secret put OPENAI_API_KEY
) else (
  npx wrangler secret put OPENAI_API_KEY
)

if defined GOOGLE_API_KEY (
  echo %GOOGLE_API_KEY% | npx wrangler secret put GOOGLE_API_KEY
) else (
  npx wrangler secret put GOOGLE_API_KEY
)

echo.
echo Optional (recommended) Upstash Redis credentials:
if defined UPSTASH_REDIS_REST_URL (
  echo %UPSTASH_REDIS_REST_URL% | npx wrangler secret put UPSTASH_REDIS_REST_URL
) else (
  echo Skipping UPSTASH_REDIS_REST_URL (not set)
)
if defined UPSTASH_REDIS_REST_TOKEN (
  echo %UPSTASH_REDIS_REST_TOKEN% | npx wrangler secret put UPSTASH_REDIS_REST_TOKEN
) else (
  echo Skipping UPSTASH_REDIS_REST_TOKEN (not set)
)

echo.
echo Done.

endlocal

