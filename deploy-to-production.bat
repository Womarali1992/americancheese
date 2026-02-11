@echo off
REM Deploy American Cheese to Production Server
REM Update these variables with your production server details

echo ========================================
echo Deploying to Production
echo ========================================
echo.

REM Set your production server details here
set SERVER_HOST=your-server-ip-or-domain
set SERVER_USER=your-username
set APP_PATH=/var/www/apps/americancheese

echo Step 1: Pulling latest code...
ssh %SERVER_USER%@%SERVER_HOST% "cd %APP_PATH% && git pull origin main"
if %errorlevel% neq 0 (
    echo ERROR: Failed to pull code
    exit /b 1
)
echo ✅ Code pulled successfully
echo.

echo Step 2: Checking database status...
ssh %SERVER_USER%@%SERVER_HOST% "cd %APP_PATH% && node check-production-data.js"
echo.

echo Step 3: Do you need to initialize categories? (y/n)
set /p INIT_CATS="Initialize categories for projects without them? (y/n): "
if /i "%INIT_CATS%"=="y" (
    echo Initializing project categories...
    ssh %SERVER_USER%@%SERVER_HOST% "cd %APP_PATH% && node initialize-project-categories.js"
    echo ✅ Categories initialized
    echo.
)

echo Step 4: Restarting server...
echo Choose restart method:
echo 1. PM2
echo 2. Systemd
echo 3. Docker Compose
set /p RESTART_METHOD="Enter option (1-3): "

if "%RESTART_METHOD%"=="1" (
    ssh %SERVER_USER%@%SERVER_HOST% "pm2 restart americancheese"
    echo ✅ PM2 restarted
) else if "%RESTART_METHOD%"=="2" (
    ssh %SERVER_USER%@%SERVER_HOST% "sudo systemctl restart americancheese"
    echo ✅ Systemd service restarted
) else if "%RESTART_METHOD%"=="3" (
    ssh %SERVER_USER%@%SERVER_HOST% "cd %APP_PATH% && docker-compose restart"
    echo ✅ Docker containers restarted
) else (
    echo Invalid option. Please restart manually.
)

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Next: Visit https://app.sitesetups.com/dashboard to verify
echo - Projects should load
echo - Categories should appear
echo - Tasks should display
echo.
pause
