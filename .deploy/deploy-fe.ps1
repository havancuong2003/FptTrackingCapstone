param(
  [string]$Zip     = "C:\deploy\incoming\fe\dist.zip",
  [string]$Staging = "C:\deploy\incoming\fe\_staging",
  [string]$Live    = "C:\sites\myapp-fe\dist",
  [string]$Sha     = "",
  [string]$Branch  = ""
)

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

if (!(Test-Path $Zip))  { throw "Zip not found: $Zip" }
if (!(Test-Path $Live)) { New-Item -ItemType Directory -Force -Path $Live | Out-Null }

Remove-Item $Staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Staging | Out-Null
Expand-Archive -Path $Zip -DestinationPath $Staging -Force

# Xóa sạch live (giữ web.config)
Get-ChildItem $Live -Force -Recurse -Exclude web.config |
  Remove-Item -Force -Recurse -ErrorAction SilentlyContinue

# Mirror staging -> live
$null = robocopy $Staging $Live /MIR /NFL /NDL /NP /NJH /NJS
Write-Host "ROBOCOPY exit code: $LASTEXITCODE (0/1 = success)"

# Version markers
$stamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss') + 'Z'
Set-Content -Encoding utf8 (Join-Path $Live 'version.txt')  @"
sha=$Sha
branch=$Branch
deployed=$stamp
"@
@{sha=$Sha;branch=$Branch;deployed=$stamp} |
  ConvertTo-Json | Set-Content -Encoding utf8 (Join-Path $Live 'version.json')

Restart-WebAppPool -Name 'myapp-fe'
(Get-WebAppPoolState 'myapp-fe').Value | Write-Host
