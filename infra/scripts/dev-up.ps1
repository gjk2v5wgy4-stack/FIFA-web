param(
  [switch]$SkipInit,
  [int]$HealthWaitSeconds = 90
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = if (Test-Path -LiteralPath (Join-Path $Root '.env')) { '.env' } else { '.env.example' }

Push-Location $Root
try {
  docker compose --env-file $envFile up -d --build
  if (-not $SkipInit) {
    & (Join-Path $PSScriptRoot 'dev-init.ps1')
  }
  & (Join-Path $PSScriptRoot 'dev-health.ps1') -WaitSeconds $HealthWaitSeconds
} finally {
  Pop-Location
}

