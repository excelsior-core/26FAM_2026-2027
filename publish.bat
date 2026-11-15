@echo off
setlocal
chcp 65001 > nul
echo ========================================================
echo   FAM / FUNDAMENTAL ^& APPLIED MATH — ПУБЛИКАЦИЯ
echo ========================================================
echo.
node "%~dp0fam-web\scripts\deploy_gh_pages.mjs"
if %ERRORLEVEL% EQU 0 (
  echo.
  echo Публикация исходного кода в main...
  git add -A
  git commit -m "feat(fam): update all lectures to FAM template and refresh library"
  git push origin main
  echo Исходный код успешно синхронизирован с веткой main!
)
pause
