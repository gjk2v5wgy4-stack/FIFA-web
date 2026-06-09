param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'

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

$envPath = if (Test-Path -LiteralPath (Join-Path $Root '.env')) {
  Join-Path $Root '.env'
} else {
  Join-Path $Root '.env.example'
}

$env = Read-EnvFile $envPath
$qdrantUrl = $env['QDRANT_URL']
$collection = $env['QDRANT_COLLECTION']
if ([string]::IsNullOrWhiteSpace($qdrantUrl)) {
  $qdrantUrl = 'http://localhost:6333'
}
if ([string]::IsNullOrWhiteSpace($collection)) {
  $collection = 'worldcup_document_chunks'
}

$body = Get-Content -LiteralPath (Join-Path $Root 'infra\qdrant\init-collection.json') -Raw
$uri = "$qdrantUrl/collections/$collection"

$initialized = $false
for ($i = 0; $i -lt 30; $i++) {
  try {
    Invoke-RestMethod -Method Put -Uri $uri -ContentType 'application/json' -Body $body | Out-Null
    $initialized = $true
    break
  } catch {
    if ($i -eq 29) {
      throw
    }
    Start-Sleep -Seconds 2
  }
}

if (-not $initialized) {
  throw "Qdrant collection initialization failed: $collection"
}
Write-Host "Qdrant collection initialized: $collection"
