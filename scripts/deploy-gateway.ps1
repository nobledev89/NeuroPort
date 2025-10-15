param(
  [switch]$BuildOnly
)

Write-Host "Installing deps..."
npm ci

Write-Host "Building gateway..."
npm -w apps/gateway run build

if (-not $BuildOnly) {
  Write-Host "Deploying gateway via wrangler..."
  npm -w apps/gateway run deploy
}

Write-Host "Done."

