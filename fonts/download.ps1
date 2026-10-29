# fonts/download.ps1 - Скрипт скачивания WOFF2 шрифтов Unbounded и Golos Text без сторонних утилит
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$fontsDir = $PSScriptRoot
if (-not (Test-Path $fontsDir)) {
    New-Item -ItemType Directory -Path $fontsDir -Force | Out-Null
}

Write-Host "===> Загрузка шрифтов для «“конспекты” ФПМ»..." -ForegroundColor Cyan

# Прямые ссылки на стабильные релизы WOFF2 с поддержкой кириллицы
$fonts = @(
    @{
        Name = "unbounded-variable.woff2"
        Url  = "https://github.com/google/fonts/raw/main/ofl/unbounded/Unbounded%5Bwght%5D.ttf"
    },
    @{
        Name = "golos-text-variable.woff2"
        Url  = "https://github.com/google/fonts/raw/main/ofl/golostext/GolosText%5Bwght%5D.ttf"
    }
)

foreach ($font in $fonts) {
    $outPath = Join-Path $fontsDir $font.Name
    if (Test-Path $outPath) {
        Write-Host " [✓] $($font.Name) уже существует." -ForegroundColor Green
        continue
    }
    Write-Host " [*] Скачивание $($font.Name)..." -ForegroundColor Yellow
    try {
        Invoke-WebRequest -Uri $font.Url -OutFile $outPath -UseBasicParsing -TimeoutSec 30
        Write-Host " [✓] Успешно скачан $($font.Name)" -ForegroundColor Green
    } catch {
        Write-Warning "Не удалось скачать $($font.Name): $_. Сайт будет использовать системный типографический стек."
    }
}

Write-Host "===> Готово! Шрифт готов к локальному использованию без внешних CDN." -ForegroundColor Cyan
