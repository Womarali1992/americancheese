# PowerShell script to upload American Cheese to DigitalOcean droplet
# Usage: .\deploy\upload-to-server.ps1 YOUR_DROPLET_IP

param(
    [Parameter(Mandatory=$true)]
    [string]$ServerIP
)

$ProjectRoot = Split-Path -Parent $PSScriptRoot

Write-Host "==================================="
Write-Host "Uploading American Cheese to $ServerIP"
Write-Host "==================================="

# Create a temporary directory for the archive
$TempDir = Join-Path $env:TEMP "americancheese-deploy"
$ArchivePath = Join-Path $TempDir "americancheese.tar.gz"

# Clean up any existing temp directory
if (Test-Path $TempDir) {
    Remove-Item -Recurse -Force $TempDir
}
New-Item -ItemType Directory -Path $TempDir | Out-Null

Write-Host "Creating archive (excluding node_modules, .git)..."

# Change to project directory and create archive
Push-Location $ProjectRoot
try {
    # Use tar if available (Windows 10+)
    tar -czvf $ArchivePath --exclude=node_modules --exclude=.git --exclude=dist .
} finally {
    Pop-Location
}

Write-Host "Uploading to server..."
scp $ArchivePath "root@${ServerIP}:/var/www/americancheese/"

Write-Host "Extracting on server..."
ssh "root@$ServerIP" @"
cd /var/www/americancheese
tar -xzvf americancheese.tar.gz
rm americancheese.tar.gz
echo 'Files extracted successfully!'
"@

# Clean up
Remove-Item -Recurse -Force $TempDir

Write-Host ""
Write-Host "==================================="
Write-Host "Upload complete!"
Write-Host "==================================="
Write-Host ""
Write-Host "Next: SSH into your server and run the deployment commands:"
Write-Host "  ssh root@$ServerIP"
Write-Host "  cd /var/www/americancheese"
Write-Host "  npm ci && npm run build && npm run db:push"
Write-Host "  pm2 start dist/index.js --name americancheese"
Write-Host ""
