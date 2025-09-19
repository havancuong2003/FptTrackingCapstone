param(
  [string]$Zip = "C:\deploy\incoming\fe\dist.zip",
  [string]$Live = "C:\sites\myapp-fe\dist",
  [string]$Staging = "C:\deploy\incoming\fe\_staging",
  [string]$BackupRoot = "C:\deploy\backups\fe",
  [string]$Sha = "",
  [string]$Branch = ""
)

$ErrorActionPreference = "Stop"
Import-Module WebAdministration

if (!(Test-Path $Zip))  { throw "Zip not found: $Zip" }
if (!(Test-Path $Live)) { New-Item -ItemType Directory -Force -Path $Live | Out-Null }

# extract
Remove-Item $Staging -Recurse -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path $Staging | Out-Null
Expand-Archive -Path $Zip -DestinationPath $Staging -Force

# backup (optional)
New-Item -ItemType Directory -Force -Path $BackupRoot | Out-Null
$stamp  = Get-Date -Format 'yyyy-MM-dd_HH-mm-ss'
$backup = Join-Path $BackupRoot $stamp
robocopy $Live $backup /MIR /NFL /NDL /NP /NJH /NJS | Out-Null

# clean live (giữ web.config nếu có) và copy
Get-ChildItem $Live -Force -Recurse -Exclude web.config | Remove-Item -Force -Recurse -ErrorAction SilentlyContinue
robocopy $Staging $Live /E /R:1 /W:1 | Out-Null

# version marker
$ver = @(
  "sha=$Sha",
  "branch=$Branch",
  "deployed=$((Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss'))Z"
) -join "`r`n"
Set-Content -Path (Join-Path $Live 'version.txt') -Value $ver -Encoding utf8

Restart-WebAppPool -Name 'myapp-fe'
(Get-WebAppPoolState 'myapp-fe').Value | Write-Host
