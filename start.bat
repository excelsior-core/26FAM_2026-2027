@echo off
setlocal

set "NODE_CMD="

REM 1. Check in PATH
where node >nul 2>nul
if %ERRORLEVEL% equ 0 (
    set "NODE_CMD=node"
    goto :run
)

REM 2. Check Strata node
if exist "%LOCALAPPDATA%\Programs\Strata\node\node.exe" (
    set "NODE_CMD=%LOCALAPPDATA%\Programs\Strata\node\node.exe"
    goto :run
)

REM 3. Check Program Files
if exist "%ProgramFiles%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    goto :run
)

echo [ERROR] Node.js not found.
pause
exit /b 1

:run
echo Starting local web server...
"%NODE_CMD%" "%~dp0scripts\serve.js"

pause
