param([string]$Mode = 'site')
$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskNode = (Get-Command node.exe -ErrorAction SilentlyContinue).Source
if (-not $taskNode) {
  $taskNode = Get-ChildItem -LiteralPath 'C:\Program Files\WindowsApps' -Directory -Filter 'OpenAI.CodexPrimaryRuntime*' -ErrorAction SilentlyContinue | Sort-Object Name -Descending | ForEach-Object { Join-Path $_.FullName 'dependencies\node\bin\node.exe' } | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1
}
if (-not $taskNode) { throw 'Node.js 22+ is required. Install from nodejs.org and restart.' }
if (-not (Get-Command python.exe -ErrorAction SilentlyContinue)) { throw 'Python with pypdf is required: python -m pip install pypdf' }
if ($Mode -eq 'build') { & $taskNode (Join-Path $PSScriptRoot 'build.mjs'); exit $LASTEXITCODE }
$taskRunning = $false
try { $taskReply = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/api/session' -TimeoutSec 2 -UseBasicParsing; $taskRunning = $taskReply.StatusCode -eq 200 } catch {}
if (-not $taskRunning) {
  $taskArgs = @('"' + (Join-Path $PSScriptRoot 'server.mjs') + '"')
  if ($Mode -eq 'watch') { $taskArgs += '--watch' }
  $taskProcess = Start-Process -FilePath $taskNode -ArgumentList $taskArgs -WorkingDirectory $taskRoot -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $taskRoot '.local\server.log') -RedirectStandardError (Join-Path $taskRoot '.local\server-error.log')
  $taskProcess.Id | Set-Content -LiteralPath (Join-Path $taskRoot '.local\server.pid')
  for ($taskTry=0; $taskTry -lt 90; $taskTry++) { Start-Sleep -Seconds 1; try { $null = Invoke-WebRequest -Uri 'http://127.0.0.1:4173/api/session' -TimeoutSec 1 -UseBasicParsing; $taskRunning=$true; break } catch {} }
}
if (-not $taskRunning) { throw 'Server did not start. See fam-web\.local\server-error.log' }
if ($Mode -eq 'watch') { $taskSession=Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/session'; $null=Invoke-RestMethod -Uri 'http://127.0.0.1:4173/api/watch' -Method Post -Headers @{'X-FAM-Token'=$taskSession.token} -ContentType 'application/json' -Body '{"enabled":true}' }
$taskUrl = if ($Mode -eq 'site') { 'http://127.0.0.1:4173/' } else { 'http://127.0.0.1:4173/admin' }
Start-Process $taskUrl
