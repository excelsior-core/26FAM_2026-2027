@echo off
chcp 65001 > nul
title «"конспекты" ФПМ» - Локальный сервер

echo =======================================================
echo   «"конспекты" ФПМ» - Запуск сайта
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
        echo [ОШИБКА] Node.js не найден.
        pause
        exit /b 1
    )
)

echo Запуск локального сервера...
"%NODE_CMD%" scripts\serve.js

pause
