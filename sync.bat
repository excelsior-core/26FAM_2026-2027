@echo off
chcp 65001 > nul
title «"конспекты" ФПМ» - Синхронизация и деплой

echo =======================================================
echo   «"конспекты" ФПМ» - Синхронизация лекций и шифрование
echo =======================================================
echo.

set "NODE_CMD=node"

where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Strata\node\node.exe" (
        set "NODE_CMD=%LOCALAPPDATA%\Programs\Strata\node\node.exe"
    ) else if exist "%ProgramFiles%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles%\nodejs\node.exe"
    ) else if exist "%ProgramFiles(x86)%\nodejs\node.exe" (
        set "NODE_CMD=%ProgramFiles(x86)%\nodejs\node.exe"
    ) else (
        echo [ОШИБКА] Node.js не найден в системе.
        echo Пожалуйста, установите Node.js LTS: https://nodejs.org/
        echo.
        pause
        exit /b 1
    )
)

"%NODE_CMD%" scripts\sync.js %*

if %ERRORLEVEL% neq 0 (
    echo.
    echo [!] Произошла ошибка во время синхронизации.
    pause
) else (
    echo.
    echo [✓] Синхронизация успешно завершена!
    timeout /t 3 > nul
)
