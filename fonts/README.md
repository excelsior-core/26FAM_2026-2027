# Локальные шрифты проекта

Проект не использует внешние CDN ради 100% приватности, автономности и работы без интернета.

- **Заголовочный (Display):** `Unbounded` (variable, Cyrillic)
- **Основной (Body):** `Golos Text` (variable, Cyrillic)

### Как скачать:
Запустите PowerShell-скрипт:
```powershell
powershell -ExecutionPolicy Bypass -File fonts/download.ps1
```

Если шрифты не скачаны, в `styles/main.css` настроен отказоустойчивый fallback-стек системных шрифтов (`system-ui`, `Charter`, `Segoe UI`, `Georgia`), поэтому сайт будет работать корректно и аккуратно в любых условиях.
