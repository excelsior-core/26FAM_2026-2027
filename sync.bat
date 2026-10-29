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

REM 4. Check Program Files (x86)
if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
    set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
    goto :run
)

echo [ERROR] Node.js not found in PATH or standard installation directories.
pause
exit /b 1

:run
echo Running synchronization and encryption engine...
"%NODE_CMD%" "%~dp0scripts\sync.js" %*

pause
