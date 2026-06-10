param()

$ErrorActionPreference = 'Stop'
& (Join-Path $PSScriptRoot 'init-postgres.ps1')
& (Join-Path $PSScriptRoot 'init-vector.ps1')

