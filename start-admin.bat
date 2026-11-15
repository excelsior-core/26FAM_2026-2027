@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0fam-web\scripts\launch.ps1" -Mode admin
if errorlevel 1 pause
