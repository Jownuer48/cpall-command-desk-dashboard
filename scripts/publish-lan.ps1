$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$dist = Join-Path $frontend "dist"
$wwwroot = Join-Path $backend "wwwroot"
$backendFull = [System.IO.Path]::GetFullPath($backend)
$wwwrootFull = [System.IO.Path]::GetFullPath($wwwroot)

if (-not $wwwrootFull.StartsWith($backendFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean an unexpected wwwroot path: $wwwrootFull"
}

Push-Location $frontend
npm install
npm run build
Pop-Location

if (-not (Test-Path $wwwroot)) {
    New-Item -ItemType Directory -Path $wwwroot | Out-Null
}

Get-ChildItem -LiteralPath $wwwroot -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $dist "*") -Destination $wwwroot -Recurse -Force

Push-Location $backend
dotnet publish -c Release -o publish
Pop-Location

Write-Host ""
Write-Host "LAN publish complete."
Write-Host "Run from backend with:"
Write-Host "dotnet .\publish\Cpall.CommandCenter.Api.dll --urls http://0.0.0.0:5000"
