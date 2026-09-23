@echo off
title Workfront Logger - Public Access Launcher
echo ========================================================
echo   Workfront Logger - Public Laptop Hosting Launcher
echo ========================================================
echo.

echo [1/4] Starting Backend API Server (Port 3001)...
start "Workfront Logger Backend" cmd /k "cd /d %~dp0server && npm run dev"

echo [2/4] Building Production Bundle...
call npm run build

echo [3/4] Starting Preview Server (Port 5173)...
start "Workfront Logger Preview" cmd /k "cd /d %~dp0 && npm run preview"

echo.
echo Waiting 3 seconds for local servers to start...
timeout /t 3 /nobreak > nul

echo.
echo [4/4] Creating Public Internet URL using Localtunnel...
echo.
echo ========================================================
echo  Your Public URL will appear below.
echo.
echo  IMPORTANT FIRST-TIME INSTRUCTIONS:
echo  1. Open the URL provided below.
echo  2. If Localtunnel asks for a "Tunnel Password", get your
echo     laptop's IP address from https://ipv4.icanhazip.com
echo  3. Enter your IP and click "Click to Submit".
echo ========================================================
echo.

npx localtunnel --port 5173

pause
