param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'

function Fail($Message) {
  Write-Error $Message
  exit 1
}

function Read-EnvFile($Path) {
  $map = @{}
  foreach ($line in Get-Content -LiteralPath $Path) {
    if ($line -match '^\s*$' -or $line -match '^\s*#') {
      continue
    }
    if ($line -notmatch '^\s*([^=]+?)=(.*)$') {
      Fail "Invalid env line: $line"
    }
    $key = $Matches[1].Trim()
    $value = $Matches[2].Trim().Trim('"').Trim("'")
    $map[$key] = $value
  }
  return $map
}

$packageJson = Get-Content -LiteralPath (Join-Path $Root 'package.json') -Raw | ConvertFrom-Json
foreach ($script in @('lint', 'typecheck', 'dev:up', 'dev:down', 'dev:init', 'dev:health')) {
  if (-not $packageJson.scripts.$script) {
    Fail "Missing package script: $script"
  }
}

$env = Read-EnvFile (Join-Path $Root '.env.example')
$requiredEnv = @(
  'WEB_HOST_PORT',
  'API_HOST_PORT',
  'POSTGRES_HOST_PORT',
  'REDIS_HOST_PORT',
  'QDRANT_HTTP_HOST_PORT',
  'QDRANT_GRPC_HOST_PORT',
  'POSTGRES_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'REDIS_PASSWORD',
  'DATABASE_URL',
  'REDIS_URL',
  'QDRANT_URL',
  'QDRANT_COLLECTION',
  'QDRANT_VECTOR_SIZE',
  'TOKEN_LOW_BALANCE_THRESHOLD',
  'HEALTHCHECK_HOST'
)

foreach ($key in $requiredEnv) {
  if (-not $env.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($env[$key])) {
    Fail "Missing env example value: $key"
  }
}

$portKeys = @('WEB_HOST_PORT', 'API_HOST_PORT', 'POSTGRES_HOST_PORT', 'REDIS_HOST_PORT', 'QDRANT_HTTP_HOST_PORT', 'QDRANT_GRPC_HOST_PORT')
$ports = @()
foreach ($key in $portKeys) {
  $port = 0
  if (-not [int]::TryParse($env[$key], [ref]$port) -or $port -lt 1 -or $port -gt 65535) {
    Fail "Invalid port for $key"
  }
  $ports += $port
}

if (($ports | Select-Object -Unique).Count -ne $ports.Count) {
  Fail 'Host ports must be unique.'
}

if ($env['QDRANT_COLLECTION'] -ne 'worldcup_document_chunks') {
  Fail 'QDRANT_COLLECTION must match docs/api/data-model.md.'
}

$qdrantConfig = Get-Content -LiteralPath (Join-Path $Root 'infra\qdrant\init-collection.json') -Raw | ConvertFrom-Json
if ($qdrantConfig.vectors.size -ne [int]$env['QDRANT_VECTOR_SIZE']) {
  Fail 'Qdrant vector size must match .env.example.'
}

$dockerfile = Get-Content -LiteralPath (Join-Path $Root 'Dockerfile') -Raw
foreach ($target in @('AS api-dev', 'AS web-dev')) {
  if ($dockerfile -notmatch [regex]::Escape($target)) {
    Fail "Missing Dockerfile target: $target"
  }
}

$compose = Get-Content -LiteralPath (Join-Path $Root 'docker-compose.yml') -Raw
foreach ($service in @('web:', 'api:', 'postgres:', 'redis:', 'qdrant:')) {
  if ($compose -notmatch "(\n|\r\n)\s{2}$([regex]::Escape($service))") {
    Fail "Missing compose service: $service"
  }
}

$schema = Get-Content -LiteralPath (Join-Path $Root 'infra\postgres\initdb\001_schema.sql') -Raw
foreach ($table in @('users', 'admin_action_logs', 'token_ledger', 'ai_usage_logs', 'documents', 'document_chunks', 'predictions', 'reports')) {
  if ($schema -notmatch "CREATE TABLE IF NOT EXISTS $table") {
    Fail "Missing PostgreSQL table: $table"
  }
}

foreach ($status in @('pending_approval', 'approved', 'rejected', 'suspended')) {
  if ($schema -notmatch $status) {
    Fail "Missing user status in schema: $status"
  }
}

foreach ($action in @('approve_user', 'reject_user', 'suspend_user', 'reactivate_user', 'grant_tokens', 'adjust_tokens', 'revoke_tokens')) {
  if ($schema -notmatch $action) {
    Fail "Missing admin action in schema: $action"
  }
}

Write-Host 'DevOps typecheck passed.'
