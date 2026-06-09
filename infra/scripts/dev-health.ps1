param(
  [string]$Root = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path,
  [int]$WaitSeconds = 0,
  [switch]$Json
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

function Test-Tcp($Name, $HostName, $Port) {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $task = $client.ConnectAsync($HostName, [int]$Port)
    if (-not $task.Wait(1500)) {
      return [pscustomobject]@{ service = $Name; endpoint = "$HostName`:$Port"; healthy = $false; detail = 'tcp timeout' }
    }
    return [pscustomobject]@{ service = $Name; endpoint = "$HostName`:$Port"; healthy = $client.Connected; detail = 'tcp reachable' }
  } catch {
    return [pscustomobject]@{ service = $Name; endpoint = "$HostName`:$Port"; healthy = $false; detail = $_.Exception.Message }
  } finally {
    $client.Dispose()
  }
}

function Test-Http($Name, $Url) {
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
    $ok = [int]$response.StatusCode -ge 200 -and [int]$response.StatusCode -lt 300
    return [pscustomobject]@{ service = $Name; endpoint = $Url; healthy = $ok; detail = "http $($response.StatusCode)" }
  } catch {
    return [pscustomobject]@{ service = $Name; endpoint = $Url; healthy = $false; detail = $_.Exception.Message }
  }
}

function Invoke-Checks($Env) {
  $healthHost = if ($Env['HEALTHCHECK_HOST']) { $Env['HEALTHCHECK_HOST'] } else { '127.0.0.1' }
  @(
    (Test-Http 'web' "http://$healthHost`:$($Env['WEB_HOST_PORT'])/healthz"),
    (Test-Http 'api' "http://$healthHost`:$($Env['API_HOST_PORT'])/healthz"),
    (Test-Tcp 'postgres' $healthHost $Env['POSTGRES_HOST_PORT']),
    (Test-Tcp 'redis' $healthHost $Env['REDIS_HOST_PORT']),
    (Test-Http 'qdrant' "http://$healthHost`:$($Env['QDRANT_HTTP_HOST_PORT'])/healthz")
  )
}

$envPath = if (Test-Path -LiteralPath (Join-Path $Root '.env')) {
  Join-Path $Root '.env'
} else {
  Join-Path $Root '.env.example'
}

$env = Read-EnvFile $envPath
$deadline = (Get-Date).AddSeconds($WaitSeconds)

do {
  $results = Invoke-Checks $env
  $allHealthy = ($results | Where-Object { -not $_.healthy }).Count -eq 0
  if ($allHealthy -or (Get-Date) -ge $deadline) {
    break
  }
  Start-Sleep -Seconds 3
} while ($true)

if ($Json) {
  $results | ConvertTo-Json -Depth 4
} else {
  $results | Format-Table -AutoSize
}

if (($results | Where-Object { -not $_.healthy }).Count -gt 0) {
  exit 1
}
