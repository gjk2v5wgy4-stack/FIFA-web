param()

$ErrorActionPreference = 'Stop'
$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path

function Read-EnvFile($Path) {
  $map = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*$' -or $line -match '^\s*#') {
      continue
    }
    if ($line -match '^\s*([^=]+?)=(.*)$') {
      $map[$Matches[1].Trim()] = $Matches[2].Trim().Trim('"').Trim("'")
    }
  }
  return $map
}

$envFile = if (Test-Path -LiteralPath (Join-Path $Root '.env')) { '.env' } else { '.env.example' }
$env = Read-EnvFile (Join-Path $Root $envFile)
$postgresUser = if ($env['POSTGRES_USER']) { $env['POSTGRES_USER'] } else { 'worldcup_app' }
$postgresDb = if ($env['POSTGRES_DB']) { $env['POSTGRES_DB'] } else { 'worldcup_ai_prediction' }

Push-Location $Root
try {
  docker compose --env-file $envFile up -d postgres
  $ready = $false
  for ($i = 0; $i -lt 30; $i++) {
    docker compose --env-file $envFile exec -T postgres pg_isready -U $postgresUser -d $postgresDb | Out-Null
    if ($LASTEXITCODE -eq 0) {
      $ready = $true
      break
    }
    Start-Sleep -Seconds 2
  }
  if (-not $ready) {
    throw 'PostgreSQL did not become ready before initialization timeout.'
  }
  docker compose --env-file $envFile exec -T postgres psql -U $postgresUser -d $postgresDb -f /docker-entrypoint-initdb.d/001_schema.sql
  Write-Host 'PostgreSQL initialization applied.'
} finally {
  Pop-Location
}
