Write-Host "Starting persistent Localtunnel loop on port 5173..." -ForegroundColor Green

while ($true) {
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Launching localtunnel with professional subdomain..." -ForegroundColor Yellow
    npx --yes localtunnel --port 5173 --local-host 127.0.0.1 --subdomain workfront-logger-2026
    Write-Host "[$(Get-Date -Format 'HH:mm:ss')] Tunnel disconnected. Reconnecting in 3 seconds..." -ForegroundColor Red
    Start-Sleep -Seconds 3
}
