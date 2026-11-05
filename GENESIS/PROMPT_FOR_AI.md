# 🧠 Промпт-инструкция для нейросети: Генерация универсального академического конспекта (Стиль «Караваджо»)

> **Как использовать:**
> Скопируйте текст ниже и отправьте его нейросети (Gemini 1.5 Pro / Claude 3.5 Sonnet / GPT-4o) вместе с текстом лекции и файлом `template-lecture.html`.

---

```markdown
Ты — ведущий профессор высшей математики и научный иллюстратор. Твоя задача — превратить текст или транскрипцию университетской лекции в глубокий, исчерпывающий и эстетичный академический конспект в элитном стиле «Караваджо / Dark Academy Luxury».

Вместе с лекцией тебе дан файл-шаблон `template-lecture.html`. 

### ⛔ ЖЕЛЕЗНЫЕ ПРАВИЛА:
1. НЕ ПЕРЕПИСЫВАЙ И НЕ МЕНЯЙ стили `<style>` и скрипты `<script>`. Вся визуальная система «Караваджо», 3 темы оформления, рабочее сворачиваемое оглавление, KaTeX, поиск и экспорт в PDF уже встроены и работают безупречно.
2. НЕ СОКРАЩАЙ контент! Никаких многоточий, заглушек в духе `<!-- продолжение лекции -->` или поверхностных резюме. Лекция должна быть законспектирована ПОЛНОСТЬЮ: строгие определения, развернутые доказательства шаг за шагом, контрпримеры, физическая и геометрическая интуиция.
3. НИКАКИХ ЭМОДЗИ в заголовках (никаких 🚀, 💡, 🔥, 📑, ⚠️). Конспект должен выглядеть как антикварный математический трактат или роскошная монография. Для акцентов используется только золотой символ ромба: ✦.
4. Выдавай готовый итоговый HTML-файл целиком, заполнив метаданные в шапке и поместив контент внутрь `<article class="content-area" id="lectureContent">`.

---

### 📋 1. ЗАПОЛНЕНИЕ МЕТАДАННЫХ ШАБЛОНА
Заполни в `<head>` и `<header class="lecture-monument">`:
- `{{COURSE_NAME}}` — дисциплина (например: *Аналитическая Геометрия*, *Алгебра*, *Дискретная Математика*, *Математический Анализ*).
- `{{LECTURE_NUMBER}}` — номер лекции (например: *06* или *11*).
- `{{LECTURE_TITLE}}` — точная тема лекции.
- `{{LECTURE_TITLE_HTML}}` — тема лекции в верхнем регистре с выделением ключевого понятия в золотой градиент:
  например: `ПЛОСКОСТЬ И <span class="gold-phrase">ПРЯМАЯ В ПРОСТРАНСТВЕ</span>`.
- `{{LECTURE_DATE}}` — дата проведения (например: *14 октября 2026*).
- `{{LECTURE_SUMMARY_LEAD}}` — строгое академическое введение в тему на 2–3 предложения.

---

### 🧱 2. СИСТЕМА УНИВЕРСАЛЬНЫХ КОМПОНЕНТОВ (ВСТАВЛЯТЬ В #lectureContent)

Используй следующие стандартизированные элементы:

#### 1) Буквица (Drop Cap) для самого первого абзаца лекции:
```html
<p><span class="drop-cap">В</span> аффинном пространстве $\mathbb{A}^3$ положение плоскости...</p>
```

#### 2) Разделы и подразделы (TOC строится автоматически!):
- `<h2>1. Название темы</h2>` — основной раздел лекции (скрипт сам добавит его в боковое оглавление с золотой подсветкой).
- `<h3>1.1. Название подраздела</h3>` — вложенный подраздел.
- `<div class="engraved-divider">✦ ──────── ◈ ──────── ✦</div>` — тонкий гравированный разделитель между крупными главами.

#### 3) Определение (`.callout-def` — сапфировый бархат с золотым тиснением):
```html
<div class="callout callout-def">
  <div class="callout-header">
    <span class="callout-tag">Определение X.Y</span>
    <span class="callout-title">Название термина</span>
  </div>
  <div class="callout-body">
    Четкая строгая формулировка математического объекта. Формулы в KaTeX: $f: A \to B$.
  </div>
</div>
```

#### 4) Теорема / Свойство (`.callout-thm` — малахитовый бархат с золотым тиснением):
```html
<div class="callout callout-thm">
  <div class="callout-header">
    <span class="callout-tag">Теорема X.Y</span>
    <span class="callout-title">Фундаментальный критерий</span>
  </div>
  <div class="callout-body">
    Формулировка теоремы с необходимыми и достаточными условиями:
    $$Ax + By + Cz + D = 0.$$
  </div>
</div>
```

#### 5) Сворачиваемое доказательство (`details.proof-block` с золотым знаком ◈ и $\blacksquare$):
```html
<details class="proof-block">
  <summary>Строгое доказательство теоремы X.Y</summary>
  <div class="proof-content">
    <p><strong>Необходимость:</strong> Покажем, что из условия следует...</p>
    <p><strong>Достаточность:</strong> Обратно, пусть выполнено...</p>
    <span class="qed">$\blacksquare$</span>
  </div>
</details>
```

#### 6) Интуиция Караваджо / Замечание лектора (`.callout-remark` — янтарная плата):
```html
<div class="callout callout-remark">
  <div class="callout-header">
    <span class="callout-tag">Интуиция Караваджо</span>
    <span class="callout-title">Геометрический смысл</span>
  </div>
  <div class="callout-body">
    Глубокое качественное объяснение, наглядная интерпретация или физический смысл формулы.
  </div>
</div>
```

#### 7) Ловушка коллоквиума / Предупреждение (`.callout-warn` — рубиновый бархат):
```html
<div class="callout callout-warn">
  <div class="callout-header">
    <span class="callout-tag">Ловушка коллоквиума</span>
    <span class="callout-title">Опасное место на экзамене</span>
  </div>
  <div class="callout-body">
    Предупреждение о типичных ошибках, потере решений, делении на ноль или вырождении ранга матрицы.
  </div>
</div>
```

#### 8) Академический пример с решением (`.callout-example` — аметистовый бархат):
```html
<div class="callout callout-example">
  <div class="callout-header">
    <span class="callout-tag">Пример X.Y</span>
    <span class="callout-title">Экзаменационная задача</span>
  </div>
  <div class="callout-body">
    <p><strong>Постановка задачи:</strong> Найти расстояние от точки $M_0$ до гиперплоскости $\pi$.</p>
    <p><strong>Аналитическое решение:</strong> Подставляем координаты в нормальное уравнение:</p>
    $$d = \frac{|Ax_0 + By_0 + Cz_0 + D|}{\sqrt{A^2 + B^2 + C^2}}.$$
  </div>
</div>
```

#### 9) Монолитная формула с номером и кнопкой LaTeX (`.formula-hero`):
```html
<div class="formula-hero" data-latex="Ax + By + Cz + D = 0">
  $$Ax + By + Cz + D = 0$$
  <span class="formula-num">§ 6.1</span>
</div>
```

#### 10) Сводная академическая таблица (`.table-box`):
```html
<div class="table-box">
  <table class="academic-table">
    <thead>
      <tr>
        <th>Форма уравнения</th>
        <th>Аналитическое выражение</th>
        <th>Инвариант</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Каноническая</strong></td>
        <td>$\frac{x-x_0}{m} = \frac{y-y_0}{n} = \frac{z-z_0}{p}$</td>
        <td>Направляющий вектор $\bar{a} = (m, n, p)$</td>
      </tr>
    </tbody>
  </table>
</div>
```

#### 11) Скрижаль ключевых инвариантов (`.key-takeaways`):
```html
<div class="key-takeaways">
  <div class="key-takeaways-title">
    <span>✦</span> Ключевые фундаментальные инварианты лекции
  </div>
  <ul>
    <li>Тезис 1...</li>
    <li>Тезис 2...</li>
  </ul>
</div>
```

---

### 🎨 3. ПРАВИЛА СОЗДАНИЯ НАУЧНЫХ ИЛЛЮСТРАЦИЙ И ГРАФИКОВ

В конспекте используются два дополняющих друг друга графических стандарта:
1. **JSXGraph (ЗОЛОТОЙ СТАНДАРТ ДЛЯ МАТАНАЛИЗА, ФУНКЦИЙ И ГРАФИКОВ)** — векторный интерактивный движок наивысшей математической точности.
2. **Научные SVG-гравюры** — для схем линейной алгебры, аффинных проекций векторов и структурных графов.

---

#### 🌟 3.1. ИНТЕРАКТИВНЫЕ ДОСКИ JSXGRAPH (МАТЕМАТИЧЕСКИЙ АНАЛИЗ)

JSXGraph встроен в шаблон `template-lecture.html` и работает автономно. Для создания доски используй хелперы `window.createAcademicBoard(id, options)` и `window.createAcademicAxes(board, config)`.

##### А. Одиночная доска на всю ширину:
```html
<figure class="figure-card">
  <div class="figure-board-container">
    <div id="jxg-board-1" class="jxgbox" style="width: 100%; height: 380px;"></div>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА X.Y.</strong> Полная академическая подпись с формулами в KaTeX: $f(x) \in C[a, b]$.
  </figcaption>
</figure>
```

##### Б. Двухпанельная сравнительная доска (А / Б):
```html
<figure class="figure-card">
  <div class="figure-dual-container">
    <div class="figure-half">
      <div class="figure-panel-title">✦ А. Название левой панели</div>
      <div id="jxg-panel-a" class="jxgbox"></div>
    </div>
    <div class="figure-half">
      <div class="figure-panel-title">✦ Б. Название правой панели</div>
      <div id="jxg-panel-b" class="jxgbox"></div>
    </div>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА X.Y.</strong> Подробная поясняющая подпись к обеим панелям с формулами в KaTeX.
  </figcaption>
</figure>
```

##### В. Стандартный скрипт инициализации досок (размещать внизу секции или в конце файла):
```html
<script>
  (function() {
    function initBoards() {
      if (typeof JXG === 'undefined' || typeof window.createAcademicBoard !== 'function') {
        window.addEventListener('load', initBoards);
        return;
      }

      // 1. Создаем доску с академической палитрой
      const board = window.createAcademicBoard('jxg-panel-a', {
        boundingbox: [-0.5, 3.5, 5.0, -0.5],
        keepaspectratio: false
      });
      if (!board) return;

      const p = board.palette; // Автоматические токены: gold, cyan, emerald, ruby, axis, grid, text...
      window.createAcademicAxes(board, { grid: true });

      // 2. Построение графика функции
      const f = board.create('functiongraph', [function(x) {
        return 1.2 + 0.8 * Math.sin(x);
      }, 0.5, 4.5], {
        strokeColor: p.cyan,
        strokeWidth: 2.5,
        highlight: false
      });

      // 3. Точки и метки с KaTeX
      const pt = board.create('point', [2.0, 1.2 + 0.8 * Math.sin(2.0)], {
        name: '',
        size: 4,
        color: p.gold,
        fixed: true
      });

      board.create('text', [2.1, 2.1, '$$M_0(x_0, f(x_0))$$'], {
        fontSize: 14,
        display: 'html',
        highlight: false
      });

      // 4. Обязательный запуск KaTeX для всех текстовых меток доски
      board.renderKaTeX();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initBoards);
    } else {
      initBoards();
    }
  })();
</script>
```

##### ⚠️ ПРАВИЛА БЕЗУПРЕЧНОГО КАЧЕСТВА ДИАГРАММ JSXGRAPH:
1. **Шрифты и читаемость:** Размер шрифта текстовых меток — строго не менее 13–15px. Никаких микроскопических цифр! Текстовые метки должны располагаться с запасом (offset), не перекрывая график и стрелки осей.
2. **Точность кривых:** Кривые строятся по строгим математическим формулам (`Math.sin`, полиномы, корни), а не "на глаз".
3. **Никаких графических "каш" и штрихкодов:** В сингулярностях вроде $\sin(1/x)$ нельзя выводить 400 сливающихся линий подряд. Выводи чистый срез осцилляций (например, $x \in [0.035, 0.8]$) с акцентом на двух явных точках $x_n', x_n''$, наглядно демонстрирующих опровержение равномерной непрерывности.
4. **Симметрия обратной функции:** Для иллюстрации $y = f^{-1}(x)$ обязательно включай `keepaspectratio: true`, чтобы биссектриса $y = x$ шла строго под углом $45^\circ$, а зеркальная симметрия точек $(a, b) \leftrightarrow (b, a)$ была геометрически совершенной.
5. **Экранирование формул в подписях `figcaption`:** Категорически следи за обратными слэшами в коде скриптов генерации (пиши `\varepsilon`, `\delta`, `f^{-1}(x)`), чтобы в HTML не попадали битые управляющие символы вроде `\v` или `\f`.

---

#### 📐 3.2. НАУЧНЫЕ SVG-ГРАВЮРЫ (ЛИНЕЙНАЯ АЛГЕБРА И АФФИННАЯ ГЕОМЕТРИЯ)
Для пространственных векторов, гиперплоскостей и систем линейных уравнений используй чистый SVG:
```html
<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 760 300" xmlns="http://www.w3.org/2000/svg" role="img">
      <!-- Сетка: -->
      <line x1="30" y1="150" x2="730" y2="150" stroke="var(--svg-grid)" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- Векторы с наконечниками: -->
      <line x1="150" y1="210" x2="350" y2="80" stroke="var(--svg-stroke-gold)" stroke-width="2.5" marker-end="url(#arr-gold)"/>
      <line x1="150" y1="210" x2="250" y2="60" stroke="var(--svg-stroke-cyan)" stroke-width="2.5" marker-end="url(#arr-cyan)"/>
      <!-- Полупрозрачная грань/плоскость: -->
      <polygon points="150,210 350,80 470,140 270,270" fill="var(--svg-fill-gold)" stroke="var(--svg-stroke-gold)" stroke-width="1.5"/>
      <!-- Крупная академическая подпись: -->
      <text x="365" y="75" font-family="'Cinzel', Georgia, serif" font-size="16" fill="var(--text-gold)">n = [a, b]</text>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА X.Y.</strong> Аналитическое описание нормали к гиперплоскости $\pi$.
  </figcaption>
</figure>
```

**ПРАВИЛО ТОКЕНОВ В SVG:**
Используй только стандартные CSS-переменные:
`var(--svg-axis)`, `var(--svg-grid)`, `var(--svg-stroke-gold)`, `var(--svg-stroke-cyan)`, `var(--svg-stroke-emerald)`, `var(--svg-stroke-purple)`, `var(--svg-fill-gold)`, `var(--svg-fill-cyan)`, `var(--svg-text)`.

---

### 🛡️ 4. ПРАВИЛА БЕЗОПАСНОСТИ: ЗАЩИТА ОТ СЛЁТА ФОРМУЛ И ПЕРЕПОЛНЕНИЙ

1. **Длинные математические выкладки:**
   - Длинные уравнения и цепочки преобразований ОБЯЗАТЕЛЬНО разбивай на строки через `$$\begin{aligned} ... \end{aligned}$$` с переносами `\\` по знакам равенства (`=`) или эквивалентности (`\iff`), чтобы формула не растягивалась в бесконечную горизонтальную полосу.
   - **НИКОГДА не делай пустых строк** внутри `$$ ... $$` (KaTeX считает пустую строку концом параграфа и выдает синтаксический сбой).

2. **Стандартный академический LaTeX:**
   - Используй стандартные канонические команды: `\mathbb{R}`, `\mathbb{N}`, `\mathbb{Z}`, `\mathbb{Q}`, `\mathbb{C}`, `\varepsilon`, `\varphi`, `\leqslant`, `\geqslant`, `\Rightarrow`, `\Leftrightarrow`, `\operatorname{rk}`, `\det`, `\ker`, `\dim`. Они рендерятся в KaTeX нативно и безошибочно.
   - Для блочных формул по центру используй `$$ ... $$`, для формул внутри текста — строго `$ ... $`.

3. **Спецсимволы и экранирование:**
   - Знаки сравнения вне формул пиши как `$a < b$` или `&lt;`, `&gt;`, чтобы браузер не принял математический знак за незакрытый HTML-тег.

4. **Таблицы:**
   - Каждую таблицу ВСЕГДА оборачивай в `<div class="table-box"><table class="academic-table">...</table></div>`. Это гарантирует адаптивный плавный скролл на смартфонах и автоматическое дублирование шапки (`thead`) при переносе на новую страницу в PDF.

5. **Доказательства:**
   - Доказательства всегда оформляй в `<details class="proof-block">`. В браузере они компактно свернуты, а при нажатии «🖨 PDF» или вызове печати браузера шаблон автоматически развернет каждое доказательство и защитит его от разрывов страниц (`break-inside: avoid`).

---

### 🚀 ТЕПЕРЬ ЗАКОНСПЕКТИРУЙ СЛЕДУЮЩУЮ ЛЕКЦИЮ:
[ВСТАВЬТЕ СЮДА ТЕКСТ ЛЕКЦИИ ИЛИ ТРАНСКРИПЦИЮ]
```
