@echo off
REM EcIipse Studios - Reset project

echo ================================================
echo EcIipse Studios - Reset
echo ================================================
echo.
echo This will REMOVE all generated data and installs.
echo.
echo Will remove:
echo   - venv (Python virtual environment)
echo   - frontend\node_modules
echo   - frontend\dist
echo   - data\*.json, data\*.db (logs, cache, auth DB)
echo   - vrchat_auth.db in project root (if present)
echo   - __pycache__ and *.pyc
echo.
set /p confirm="Type YES to continue: "
if /i not "%confirm%"=="YES" (
    echo Cancelled.
    pause
    exit /b 0
)

cd /d "%~dp0"

echo.
echo Removing venv...
if exist venv (
    rmdir /s /q venv
    echo   Removed venv
) else (
    echo   No venv found
)

echo Removing frontend\node_modules...
if exist frontend\node_modules (
    rmdir /s /q frontend\node_modules
    echo   Removed node_modules
) else (
    echo   No node_modules found
)

echo Removing frontend\dist...
if exist frontend\dist (
    rmdir /s /q frontend\dist
    echo   Removed dist
) else (
    echo   No dist found
)

echo Removing data files...
if exist data (
    if exist data\log.json del /q data\log.json
    if exist data\group_cache.json del /q data\group_cache.json
    if exist data\user_ids.json del /q data\user_ids.json
    if exist data\vrchat_auth.db del /q data\vrchat_auth.db
    echo   Cleaned data folder
)

if exist vrchat_auth.db (
    del /q vrchat_auth.db
    echo   Removed root vrchat_auth.db
)

echo Removing __pycache__...
if exist app\__pycache__ rmdir /s /q app\__pycache__
echo   Done

echo Removing *.pyc...
del /s /q *.pyc 2>nul
echo   Done

echo.
echo ================================================
echo Reset complete. Run setup.bat to reinstall.
echo ================================================
pause
