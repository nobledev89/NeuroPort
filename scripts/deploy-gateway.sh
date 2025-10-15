#!/usr/bin/env bash
set -euo pipefail

echo "Installing deps..."
npm ci

echo "Building gateway..."
npm -w apps/gateway run build

if [[ "${BUILD_ONLY:-}" != "1" ]]; then
  echo "Deploying gateway via wrangler..."
  npm -w apps/gateway run deploy
fi

echo "Done."

