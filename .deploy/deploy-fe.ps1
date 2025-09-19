param(
  [string]$Zip = "C:\deploy\incoming\fe\dist.zip",
  [string]$Live = "C:\sites\myapp-fe\dist",
  [string]$Staging = "C:\deploy\incoming\fe\_staging",
  [string]$Sha = "",
  [string]$Branch = ""
)

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

if (!(Test-Path $Zip))  { throw "Zip not found: $Zip" }
if (!(Test-Path $Live)) { New-Item -ItemType Directory -Force -Path $Live | Out-Null }

# Extract
Remove-Item $Staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Staging | Out-Null
Expand-Archive -Path $Zip -DestinationPath $Staging -Force

# Clean LIVE (giữ web.config nếu có) rồi copy
Get-ChildItem $Live -Force -Recurse -Exclude web.config | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
robocopy $Staging $Live /E /R:1 /W:1 | Out-Null

# Version marker
$ver = @(
  "sha=$Sha",
  "branch=$Branch",
  "deployed=$((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss'))Z"
) -join "`r`n"
Set-Content -Path (Join-Path $Live 'version.txt') -Value $ver -Encoding utf8

Restart-WebAppPool -Name 'myapp-fe'
(Get-WebAppPoolState 'myapp-fe').Value | Write-Host
