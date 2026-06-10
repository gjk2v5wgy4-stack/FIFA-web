param(
  [switch]$Volumes
)

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$envFile = if (Test-Path -LiteralPath (Join-Path $Root '.env')) { '.env' } else { '.env.example' }

Push-Location $Root
try {
  if ($Volumes) {
    docker compose --env-file $envFile down --volumes
  } else {
    docker compose --env-file $envFile down
  }
} finally {
  Pop-Location
}

