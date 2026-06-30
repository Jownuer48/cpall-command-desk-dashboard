$ErrorActionPreference = "Stop"

$root = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$frontend = Join-Path $root "frontend"
$backend = Join-Path $root "backend"
$dist = Join-Path $frontend "dist"
$wwwroot = Join-Path $backend "wwwroot"
$nugetConfig = Join-Path $root "NuGet.Config"
$dotnetAppData = Join-Path $root ".tmp\dotnet-appdata"
$dotnetNugetDir = Join-Path $dotnetAppData "NuGet"
$dotnetHome = Join-Path $root ".tmp\dotnet-home"
$backendFull = [System.IO.Path]::GetFullPath($backend)
$wwwrootFull = [System.IO.Path]::GetFullPath($wwwroot)

if (-not $wwwrootFull.StartsWith($backendFull + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase)) {
    throw "Refusing to clean an unexpected wwwroot path: $wwwrootFull"
}

Push-Location $frontend
npm install
if ($LASTEXITCODE -ne 0) {
    throw "npm install failed with exit code $LASTEXITCODE"
}

npm run build
if ($LASTEXITCODE -ne 0) {
    throw "npm run build failed with exit code $LASTEXITCODE"
}

Pop-Location

if (-not (Test-Path $wwwroot)) {
    New-Item -ItemType Directory -Path $wwwroot | Out-Null
}

Get-ChildItem -LiteralPath $wwwroot -Force | Remove-Item -Recurse -Force
Copy-Item -Path (Join-Path $dist "*") -Destination $wwwroot -Recurse -Force

New-Item -ItemType Directory -Force -Path $dotnetNugetDir, $dotnetHome | Out-Null
Copy-Item -LiteralPath $nugetConfig -Destination (Join-Path $dotnetNugetDir "NuGet.Config") -Force

$previousAppData = $env:APPDATA
$previousDotnetCliHome = $env:DOTNET_CLI_HOME
$env:APPDATA = $dotnetAppData
$env:DOTNET_CLI_HOME = $dotnetHome

Push-Location $backend
try {
    dotnet publish -c Release -o publish --configfile $nugetConfig
    if ($LASTEXITCODE -ne 0) {
        throw "dotnet publish failed with exit code $LASTEXITCODE"
    }
}
finally {
    Pop-Location
    $env:APPDATA = $previousAppData
    $env:DOTNET_CLI_HOME = $previousDotnetCliHome
}

Write-Host ""
Write-Host "LAN publish complete."
Write-Host "Run from backend with:"
Write-Host "dotnet .\publish\Cpall.CommandCenter.Api.dll --urls http://0.0.0.0:5000"
