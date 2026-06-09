param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
)

$ErrorActionPreference = 'Stop'

function Fail($Message) {
  Write-Error $Message
  exit 1
}

function Require-File($Path) {
  $fullPath = Join-Path $Root $Path
  if (-not (Test-Path -LiteralPath $fullPath -PathType Leaf)) {
    Fail "Missing required file: $Path"
  }
}

$requiredFiles = @(
  'Dockerfile',
  'docker-compose.yml',
  '.env.example',
  'infra\README.md',
  'infra\postgres\initdb\001_schema.sql',
  'infra\qdrant\init-collection.json',
  'infra\scripts\dev-up.ps1',
  'infra\scripts\dev-down.ps1',
  'infra\scripts\dev-init.ps1',
  'infra\scripts\init-postgres.ps1',
  'infra\scripts\init-vector.ps1',
  'infra\scripts\dev-health.ps1',
  'infra\scripts\ci-deploy-stub.ps1'
)

foreach ($file in $requiredFiles) {
  Require-File $file
}

$forbiddenPatterns = @(
  'STRIPE_',
  'CHECKOUT',
  'SUBSCRIPTION',
  '必胜',
  '稳赚',
  '包中',
  '投注建议',
  '跟单'
)

$diffNames = git -C $Root diff --name-only HEAD --
$scanPaths = @($requiredFiles + $diffNames) | Select-Object -Unique
$scanFiles = foreach ($path in $scanPaths) {
  $fullPath = Join-Path $Root $path
  if (Test-Path -LiteralPath $fullPath -PathType Leaf) {
    Get-Item -LiteralPath $fullPath
  }
}

foreach ($file in $scanFiles) {
  $content = Get-Content -LiteralPath $file.FullName -Raw -ErrorAction SilentlyContinue
  foreach ($pattern in $forbiddenPatterns) {
    if ($content -like "*$pattern*") {
      Fail "Forbidden MVP or safety wording found in $($file.FullName): $pattern"
    }
  }
}

$forbiddenPaths = @(
  'apps/web/',
  'apps/api/',
  'packages/rag-core/',
  'packages/football-models/'
)

foreach ($path in $diffNames) {
  $normalized = $path.Replace('\', '/')
  foreach ($forbiddenPath in $forbiddenPaths) {
    if ($normalized.StartsWith($forbiddenPath)) {
      Fail "Forbidden path changed by DevOps thread: $normalized"
    }
  }
}

Write-Host 'DevOps lint passed.'
