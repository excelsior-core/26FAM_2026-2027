# -*- coding: utf-8 -*-
import os

PROMPT_PATH = os.path.join(os.path.dirname(__file__), '..', 'GENESIS', 'PROMPT_FOR_AI.md')

with open(PROMPT_PATH, 'r', encoding='utf-8') as f:
    text = f.read()

old_section_3 = """### 🎨 3. ПРАВИЛА СОЗДАНИЯ НАУЧНЫХ ГРАВЮР (SVG)
Вставляй векторные схемы (геометрические чертежи, проекции векторов, графы отношений, диаграммы):
```html
<figure class="figure-card">
  <div class="figure-svg-container">
    <svg viewBox="0 0 740 280" xmlns="http://www.w3.org/2000/svg" role="img">
      <!-- Сетка: -->
      <line x1="30" y1="140" x2="710" y2="140" stroke="var(--svg-grid)" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- Векторы: -->
      <line x1="150" y1="200" x2="350" y2="90" stroke="var(--svg-stroke-gold)" stroke-width="2.5" marker-end="url(#arr-gold)"/>
      <line x1="150" y1="200" x2="250" y2="70" stroke="var(--svg-stroke-cyan)" stroke-width="2.5" marker-end="url(#arr-cyan)"/>
      <!-- Заливка: -->
      <polygon points="150,200 350,90 450,160 250,270" fill="var(--svg-fill-gold)" stroke="var(--svg-stroke-gold)" stroke-width="1.5"/>
      <!-- Подписи: -->
      <text x="360" y="85" font-family="'Cormorant Garamond', Georgia, serif" font-size="18" font-style="italic" fill="var(--text-gold)">n = [a, b]</text>
    </svg>
  </div>
  <figcaption class="figure-caption">
    <strong>ГРАВЮРА X.Y.</strong> Подробная поясняющая подпись к математическому чертежу.
  </figcaption>
</figure>
```

**ПРАВИЛО ТОКЕНОВ В SVG:**
Используй только:
`var(--svg-axis)`, `var(--svg-grid)`, `var(--svg-stroke-gold)`, `var(--svg-stroke-cyan)`, `var(--svg-stroke-emerald)`, `var(--svg-stroke-purple)`, `var(--svg-fill-gold)`, `var(--svg-fill-cyan)`, `var(--svg-text)`."""

new_section_3 = """### 🎨 3. ПРАВИЛА СОЗДАНИЯ НАУЧНЫХ ИЛЛЮСТРАЦИЙ И ГРАФИКОВ

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
5. **Экранирование формул в подписях `figcaption`:** Категорически следи за обратными слэшами в коде скриптов генерации (пиши `\\varepsilon`, `\\delta`, `f^{-1}(x)`), чтобы в HTML не попадали битые управляющие символы вроде `\\v` или `\\f`.

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
`var(--svg-axis)`, `var(--svg-grid)`, `var(--svg-stroke-gold)`, `var(--svg-stroke-cyan)`, `var(--svg-stroke-emerald)`, `var(--svg-stroke-purple)`, `var(--svg-fill-gold)`, `var(--svg-fill-cyan)`, `var(--svg-text)`."""

assert old_section_3 in text, "old section 3 not found in PROMPT_FOR_AI.md!"
text = text.replace(old_section_3, new_section_3, 1)

with open(PROMPT_PATH, 'w', encoding='utf-8') as f:
    f.write(text)

print("Successfully updated GENESIS/PROMPT_FOR_AI.md!")
