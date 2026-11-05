# -*- coding: utf-8 -*-
import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
LEC15_CONTENT_PATH = os.path.join(ROOT_DIR, 'scripts', 'lec15_content.html')
LEC14_CONTENT_PATH = os.path.join(ROOT_DIR, 'scripts', 'lec14_content.html')

# -------------------------------------------------------------
# 1. UPDATE LEC 15 CONTENT
# -------------------------------------------------------------
with open(LEC15_CONTENT_PATH, 'r', encoding='utf-8') as f:
    c15 = f.read()

# Replace figure 15.1
fig15_1_pattern = re.compile(r'<!-- (?:Научная гравюра SVG|Интерактивная доска JSXGraph): Равномерная непрерывность vs Осцилляции -->\s*<figure class="figure-card">.*?</figure>', re.DOTALL)

fig15_1_replacement = """<!-- Интерактивная доска JSXGraph: Равномерная непрерывность vs Осцилляции -->
        <figure class="figure-card">
          <div class="figure-dual-container">
            <div class="figure-half">
              <div class="figure-panel-title">✦ А. Окно безопасности Кантора $2\\delta \\times 2\\varepsilon$</div>
              <div id="jxg-board-15-1a" class="jxgbox" style="width: 100%; height: 380px;"></div>
            </div>
            <div class="figure-half">
              <div class="figure-panel-title">✦ Б. Разрушение равномерности: $y = \\sin(1/x)$</div>
              <div id="jxg-board-15-1b" class="jxgbox" style="width: 100%; height: 380px;"></div>
            </div>
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.1.</strong> Геометрический критерий равномерной непрерывности. <em>Панель А:</em> калибр Кантора $\\delta(\\varepsilon)$ образует жесткое окно безопасности, сопровождающее график функции вдоль компакта: кривая может пересекать только боковые вертикальные границы, что гарантирует размах по вертикали не более $2\\varepsilon$. <em>Панель Б:</em> у функции $y = \\sin(1/x)$ при $x \\to +0$ частота осцилляций стремится к бесконечности; на сколь угодно малом интервале $\\delta$ размах значений равен $|f(x_n') - f(x_n'')| = 2 \\geqslant \\varepsilon_0 = 1$, что наглядно опровергает равномерную непрерывность.
          </figcaption>
        </figure>"""

assert fig15_1_pattern.search(c15), "Figure 15.1 not found in lec15_content.html!"
c15 = fig15_1_pattern.sub(lambda m: fig15_1_replacement, c15)
print("Replaced Figure 15.1 with JSXGraph dual-board markup")

# Replace figure 15.2
fig15_2_pattern = re.compile(r'<!-- (?:Научная гравюра SVG|Интерактивная доска JSXGraph): Скачок монотонной функции и обратная функция -->\s*<figure class="figure-card">.*?</figure>', re.DOTALL)

fig15_2_replacement = """<!-- Интерактивная доска JSXGraph: Скачок монотонной функции и обратная функция -->
        <figure class="figure-card">
          <div class="figure-dual-container">
            <div class="figure-half">
              <div class="figure-panel-title">✦ А. Скачок монотонной функции и лакуна в образе</div>
              <div id="jxg-board-15-2a" class="jxgbox" style="width: 100%; height: 380px;"></div>
            </div>
            <div class="figure-half">
              <div class="figure-panel-title">✦ Б. Непрерывность и симметрия обратной функции $y = f^{-1}(x)$</div>
              <div id="jxg-board-15-2b" class="jxgbox" style="width: 100%; height: 380px;"></div>
            </div>
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.2.</strong> Геометрические принципы теории монотонных отображений. <em>Панель А:</em> скачок неубывающей функции порождает непустой открытый интервал $J_{x_0} = (f(x_0 - 0), f(x_0 + 0))$, не содержащий значений функции, нарушая связность образа $f(X)$. Внутри каждого такого интервала содержится хотя бы одно рациональное число $r \\in \\mathbb{Q}$, что влечет не более чем счетность точек разрыва. <em>Панель Б:</em> график обратной функции $y = f^{-1}(x)$ строго зеркально-симметричен графику $y = f(x)$ относительно биссектрисы $y = x$; сохранение направления строгой монотонности и промежуточности значений гарантирует непрерывность $f^{-1}$.
          </figcaption>
        </figure>"""

assert fig15_2_pattern.search(c15), "Figure 15.2 not found in lec15_content.html!"
c15 = fig15_2_pattern.sub(lambda m: fig15_2_replacement, c15)
print("Replaced Figure 15.2 with JSXGraph dual-board markup")

# Remove previous script block if any
script15_pattern = re.compile(r'\s*<!-- Скрипт инициализации высокоточных математических досок JSXGraph \(Лекция 15\) -->\s*<script>.*?</script>', re.DOTALL)
c15 = script15_pattern.sub('', c15)

# Append Lecture 15 JSXGraph initialization script
lec15_script = """
        <!-- Скрипт инициализации высокоточных математических досок JSXGraph (Лекция 15) -->
        <script>
          (function() {
            function buildLecture15Boards() {
              // Board 15.1A: Cantor Security Window
              (function() {
                const board = window.createAcademicBoard('jxg-board-15-1a', {
                  boundingbox: [-0.4, 3.4, 5.2, -0.4],
                  keepaspectratio: false
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true });

                const f = function(x) { return 1.35 + 0.85 * Math.sin(0.92 * x); };
                board.create('functiongraph', [f, 0.4, 4.9], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });

                const x0 = 2.4;
                const y0 = f(x0);
                const delta = 0.65;
                const eps = 0.55;

                const p1 = board.create('point', [x0 - delta, y0 - eps], { visible: false });
                const p2 = board.create('point', [x0 + delta, y0 - eps], { visible: false });
                const p3 = board.create('point', [x0 + delta, y0 + eps], { visible: false });
                const p4 = board.create('point', [x0 - delta, y0 + eps], { visible: false });

                board.create('polygon', [p1, p2, p3, p4], {
                  fillColor: p.gold,
                  fillOpacity: 0.16,
                  borders: { strokeColor: p.gold, strokeWidth: 1.6, dash: 2 },
                  highlight: false
                });

                board.create('point', [x0, y0], {
                  name: '',
                  size: 5,
                  fillColor: p.goldBright,
                  strokeColor: p.gold,
                  fixed: true,
                  highlight: false
                });

                board.create('text', [x0 + 0.12, y0 + 0.12, '$$M_0(x_0, f(x_0))$$'], {
                  fontSize: 14,
                  display: 'html',
                  highlight: false
                });

                // Vertical projection segments
                board.create('segment', [[x0, 0], [x0, y0]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[x0 - delta, 0], [x0 - delta, y0 - eps]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[x0 + delta, 0], [x0 + delta, y0 - eps]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });

                // Horizontal projection segments
                board.create('segment', [[0, y0], [x0, y0]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[0, y0 - eps], [x0 - delta, y0 - eps]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[0, y0 + eps], [x0 - delta, y0 + eps]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });

                board.create('text', [x0 - 0.1, -0.22, '$$x_0$$'], { fontSize: 13, display: 'html' });
                board.create('text', [x0 - delta - 0.35, -0.22, '$$x_0-\\delta$$'], { fontSize: 13, display: 'html' });
                board.create('text', [x0 + delta - 0.25, -0.22, '$$x_0+\\delta$$'], { fontSize: 13, display: 'html' });

                board.create('text', [-0.38, y0, '$$f(x_0)$$'], { fontSize: 13, display: 'html' });
                board.create('text', [-0.38, y0 + eps, '$$+\\varepsilon$$'], { fontSize: 13, display: 'html' });
                board.create('text', [-0.38, y0 - eps, '$$-\\varepsilon$$'], { fontSize: 13, display: 'html' });

                board.create('text', [x0 - 0.15, y0 - eps - 0.22, '$$2\\delta$$'], { fontSize: 14, color: p.goldBright, display: 'html' });
                board.create('text', [x0 + delta + 0.15, y0, '$$2\\varepsilon$$'], { fontSize: 14, color: p.goldBright, display: 'html' });

                board.create('text', [0.4, 3.1, '$$\\text{График выходит только через вертикали: } |f(x) - f(x_0)| < \\varepsilon$$'], {
                  fontSize: 13,
                  color: p.emerald,
                  display: 'html'
                });

                board.renderKaTeX();
              })();

              // Board 15.1B: Oscillations of sin(1/x)
              (function() {
                const board = window.createAcademicBoard('jxg-board-15-1b', {
                  boundingbox: [-0.07, 1.45, 0.85, -1.45],
                  keepaspectratio: false
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true, xLabels: true, yLabels: true });

                board.create('functiongraph', [function(x) { return Math.sin(1 / x); }, 0.035, 0.8], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.2,
                  highlight: false
                });

                board.create('line', [[0, 1], [1, 1]], { strokeColor: p.axis, strokeWidth: 1.0, dash: 2 });
                board.create('line', [[0, -1], [1, -1]], { strokeColor: p.axis, strokeWidth: 1.0, dash: 2 });
                board.create('text', [-0.05, 1.0, '$$+1$$'], { fontSize: 12, display: 'html' });
                board.create('text', [-0.05, -1.0, '$$-1$$'], { fontSize: 12, display: 'html' });

                const xn1 = 1 / (4.5 * Math.PI);
                const xn2 = 1 / (5.5 * Math.PI);

                board.create('point', [xn1, 1], { name: '', size: 5, fillColor: p.goldBright, strokeColor: p.gold, fixed: true });
                board.create('point', [xn2, -1], { name: '', size: 5, fillColor: p.ruby, strokeColor: p.ruby, fixed: true });

                board.create('text', [xn1 + 0.02, 1.08, "$$M_n'\\\\left(x_n', +1\\\\right)$$"], { fontSize: 13, color: p.goldBright, display: 'html' });
                board.create('text', [xn2 + 0.02, -1.08, "$$M_n''\\\\left(x_n'', -1\\\\right)$$"], { fontSize: 13, color: p.ruby, display: 'html' });

                board.create('segment', [[xn1, 1], [xn1, -1]], { strokeColor: p.ruby, strokeWidth: 2.6, dash: 3 });
                board.create('text', [xn1 + 0.03, 0.0, '$$|\\Delta f| = 2 \\geqslant \\varepsilon_0$$'], { fontSize: 14, color: p.ruby, display: 'html' });

                board.create('segment', [[xn1, 1], [xn1, 0]], { strokeColor: p.axis, strokeWidth: 1.0, dash: 2 });
                board.create('segment', [[xn2, -1], [xn2, 0]], { strokeColor: p.axis, strokeWidth: 1.0, dash: 2 });

                board.create('segment', [[xn2, -0.15], [xn1, -0.15]], { strokeColor: p.gold, strokeWidth: 2.0 });
                board.create('text', [xn2 + 0.02, -0.32, "$$|x_n' - x_n''| < \\\\delta \\\\to 0$$"], { fontSize: 13, color: p.gold, display: 'html' });

                board.create('text', [0.22, 1.25, '$$\\forall \\delta > 0: \\Delta x < \\delta, \\text{ но } |\\Delta f| = 2$$'], {
                  fontSize: 13,
                  color: p.ruby,
                  display: 'html'
                });

                board.renderKaTeX();
              })();

              // Board 15.2A: Monotone Jump Discontinuity
              (function() {
                const board = window.createAcademicBoard('jxg-board-15-2a', {
                  boundingbox: [-0.4, 4.3, 4.6, -0.4],
                  keepaspectratio: false
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true });

                const x0 = 2.0;
                board.create('functiongraph', [function(x) { return 0.55 * x + 0.5; }, 0.5, 2.0], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });

                board.create('functiongraph', [function(x) { return 0.45 * x + 1.9; }, 2.0, 4.2], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });

                board.create('point', [x0, 1.6], {
                  name: '',
                  size: 5,
                  fillColor: p.axis,
                  strokeColor: p.gold,
                  strokeWidth: 2,
                  fixed: true
                });

                board.create('point', [x0, 2.8], {
                  name: '',
                  size: 5,
                  fillColor: p.goldBright,
                  strokeColor: p.gold,
                  fixed: true
                });

                board.create('segment', [[x0, 0], [x0, 2.8]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('text', [x0 - 0.08, -0.22, '$$x_0$$'], { fontSize: 14, color: p.goldBright, display: 'html' });

                board.create('segment', [[0, 1.6], [x0, 1.6]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[0, 2.8], [x0, 2.8]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });

                board.create('text', [-0.35, 1.6, '$$f(x_0-0)$$'], { fontSize: 13, display: 'html' });
                board.create('text', [-0.35, 2.8, '$$f(x_0+0)$$'], { fontSize: 13, display: 'html' });

                board.create('segment', [[0, 1.6], [0, 2.8]], { strokeColor: p.ruby, strokeWidth: 5.0 });

                board.create('text', [0.3, 2.2, '$$J_{x_0} = \\bigl(f(x_0-0),\\; f(x_0+0)\\bigr)$$'], { fontSize: 14, color: p.ruby, display: 'html' });
                board.create('text', [0.3, 1.85, '$$\\text{Лакуна: } J_{x_0} \\cap f(X) = \\varnothing$$'], { fontSize: 13, color: p.ruby, display: 'html' });

                board.create('point', [0, 2.2], { name: '', size: 4, fillColor: p.goldBright, strokeColor: p.gold, fixed: true });
                board.create('text', [-0.25, 2.2, '$$r \\in \\mathbb{Q}$$'], { fontSize: 12, color: p.goldBright, display: 'html' });

                board.create('text', [0.5, 3.8, '$$\\text{Скачок } h(x_0) > 0 \\implies \\text{разрыв связности образа!}$$'], { fontSize: 13, color: p.amber, display: 'html' });

                board.renderKaTeX();
              })();

              // Board 15.2B: Inverse Function Symmetry
              (function() {
                const board = window.createAcademicBoard('jxg-board-15-2b', {
                  boundingbox: [-0.4, 4.4, 4.4, -0.4],
                  keepaspectratio: true
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true });

                board.create('line', [[0, 0], [1, 1]], { strokeColor: p.gold, strokeWidth: 1.6, dash: 3, highlight: false });
                board.create('text', [3.6, 3.8, '$$y = x$$'], { fontSize: 14, color: p.goldBright, display: 'html' });

                board.create('functiongraph', [function(x) { return (x * x) / 3 + 0.4; }, 0.2, 3.3], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });
                board.create('text', [1.2, 3.7, '$$y = f(x)$$'], { fontSize: 14, color: p.cyan, display: 'html' });

                board.create('functiongraph', [function(x) { return Math.sqrt(Math.max(0, 3 * (x - 0.4))); }, 0.4, 4.1], {
                  strokeColor: p.emerald,
                  strokeWidth: 2.8,
                  highlight: false
                });
                board.create('text', [3.3, 1.5, '$$y = f^{-1}(x)$$'], { fontSize: 14, color: p.emerald, display: 'html' });

                const x0 = 1.3;
                const y0 = (x0 * x0) / 3 + 0.4;

                const M = board.create('point', [x0, y0], { name: '', size: 5, fillColor: p.cyan, strokeColor: p.cyan, fixed: true });
                const Mprime = board.create('point', [y0, x0], { name: '', size: 5, fillColor: p.emerald, strokeColor: p.emerald, fixed: true });

                board.create('text', [x0 + 0.12, y0 - 0.15, '$$M(x_0, y_0)$$'], { fontSize: 13, color: p.cyan, display: 'html' });
                board.create('text', [y0 - 0.75, x0 + 0.18, "$$M'(y_0, x_0)$$"], { fontSize: 13, color: p.emerald, display: 'html' });

                board.create('segment', [M, Mprime], { strokeColor: p.text, strokeWidth: 1.4, dash: 2 });

                const x1 = 2.4;
                const y1 = (x1 * x1) / 3 + 0.4;
                const N = board.create('point', [x1, y1], { name: '', size: 4, fillColor: p.cyan, fixed: true });
                const Nprime = board.create('point', [y1, x1], { name: '', size: 4, fillColor: p.emerald, fixed: true });
                board.create('segment', [N, Nprime], { strokeColor: p.text, strokeWidth: 1.2, dash: 2 });

                board.create('text', [0.4, 0.4, '$$\\text{Зеркальная симметрия сохраняет непрерывность}$$'], { fontSize: 13, color: p.emerald, display: 'html' });

                board.renderKaTeX();
              })();
            }

            if (typeof window.safeInitAcademicBoards === 'function') {
              window.safeInitAcademicBoards(buildLecture15Boards);
            } else {
              let cnt = 0;
              const t = setInterval(function() {
                cnt++;
                if (typeof window.safeInitAcademicBoards === 'function') {
                  clearInterval(t);
                  window.safeInitAcademicBoards(buildLecture15Boards);
                } else if (cnt > 60) {
                  clearInterval(t);
                }
              }, 60);
            }

            window.addEventListener('academicThemeChanged', function() {
              buildLecture15Boards();
            });
          })();
        </script>
"""

c15 += lec15_script

with open(LEC15_CONTENT_PATH, 'w', encoding='utf-8') as f:
    f.write(c15)
print("Saved fully updated lec15_content.html")


# -------------------------------------------------------------
# 2. UPDATE LEC 14 CONTENT
# -------------------------------------------------------------
with open(LEC14_CONTENT_PATH, 'r', encoding='utf-8') as f:
    c14 = f.read()

# Replace figure 14.1
fig14_1_pattern = re.compile(r'<!-- (?:Научная гравюра SVG|Интерактивная доска JSXGraph): (?:Бисекция отрезка|Метод дихотомии и теорема Больцано-Коши) -->\s*<figure class="figure-card">.*?</figure>', re.DOTALL)

fig14_1_replacement = """<!-- Интерактивная доска JSXGraph: Метод дихотомии и теорема Больцано-Коши -->
        <figure class="figure-card">
          <div class="figure-board-container">
            <div id="jxg-board-14-1" class="jxgbox" style="width: 100%; height: 420px;"></div>
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.1.</strong> Геометрическая визуализация первой теоремы Больцано–Коши и алгоритма дихотомии. Непрерывная траектория $y = f(x)$, связывающая разнознаковые концы $f(a) < 0$ и $f(b) > 0$, неминуемо пересекает координатную ось. Конструктивный метод половинного деления (дихотомии) порождает систему вложенных отрезков $[a_0, b_0] \\supset [a_1, b_1] \\supset [a_2, b_2] \\dots$, длины которых стремятся к нулю, стягиваясь к единственному предельному корню $c \\in (a, b)$, в котором $f(c) = 0$.
          </figcaption>
        </figure>"""

assert fig14_1_pattern.search(c14), "Figure 14.1 not found in lec14_content.html!"
c14 = fig14_1_pattern.sub(lambda m: fig14_1_replacement, c14)
print("Replaced Figure 14.1 with JSXGraph board markup")

# Replace figure 14.2
fig14_2_pattern = re.compile(r'<!-- (?:Научная гравюра SVG|Интерактивная доска JSXGraph): (?:Вторая теорема Вейерштрасса и образ отрезка|Теоремы Вейерштрасса и образ отрезка) -->\s*<figure class="figure-card">.*?</figure>', re.DOTALL)

fig14_2_replacement = """<!-- Интерактивная доска JSXGraph: Теоремы Вейерштрасса и образ отрезка -->
        <figure class="figure-card">
          <div class="figure-board-container">
            <div id="jxg-board-14-2" class="jxgbox" style="width: 100%; height: 420px;"></div>
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.2.</strong> Теоремы Вейерштрасса и непрерывный образ отрезка. На компакте $[a, b]$ непрерывная функция гарантированно достигает своих точных граней: глобального максимума $M = f(x^*)$ и глобального минимума $m = f(x_*)$. Проекция графика образует сплошной замкнутый отрезок $[m, M]$ на оси ординат, а любое промежуточное значение $C \\in (m, M)$ достигается хотя бы в одной точке (вторая теорема Больцано–Коши: $f(c) = C$).
          </figcaption>
        </figure>"""

assert fig14_2_pattern.search(c14), "Figure 14.2 not found in lec14_content.html!"
c14 = fig14_2_pattern.sub(lambda m: fig14_2_replacement, c14)
print("Replaced Figure 14.2 with JSXGraph board markup")

# Remove previous script block if any
script14_pattern = re.compile(r'\s*<!-- Скрипт инициализации высокоточных математических досок JSXGraph \(Лекция 14\) -->\s*<script>.*?</script>', re.DOTALL)
c14 = script14_pattern.sub('', c14)

# Append Lecture 14 JSXGraph initialization script
lec14_script = """
        <!-- Скрипт инициализации высокоточных математических досок JSXGraph (Лекция 14) -->
        <script>
          (function() {
            function buildLecture14Boards() {
              // Board 14.1: Bolzano-Cauchy & Bisection
              (function() {
                const board = window.createAcademicBoard('jxg-board-14-1', {
                  boundingbox: [-0.4, 3.2, 5.2, -3.2],
                  keepaspectratio: false
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true });

                const f = function(x) {
                  return 1.25 * Math.atan(1.4 * (x - 2.4)) + 0.28 * (x - 2.4);
                };
                board.create('functiongraph', [f, 0.5, 4.8], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });

                const a0 = 0.6;
                const b0 = 4.6;
                const c = 2.4;

                board.create('point', [a0, f(a0)], { name: '', size: 5, fillColor: p.ruby, strokeColor: p.ruby, fixed: true });
                board.create('point', [b0, f(b0)], { name: '', size: 5, fillColor: p.emerald, strokeColor: p.emerald, fixed: true });

                board.create('text', [a0 + 0.1, f(a0) - 0.25, '$$f(a) < 0$$'], { fontSize: 13, color: p.ruby, display: 'html' });
                board.create('text', [b0 - 0.8, f(b0) + 0.25, '$$f(b) > 0$$'], { fontSize: 13, color: p.emerald, display: 'html' });

                board.create('point', [c, 0], {
                  name: '',
                  size: 6,
                  fillColor: p.goldBright,
                  strokeColor: p.gold,
                  fixed: true
                });
                board.create('text', [c - 0.1, 0.35, '$$c: f(c) = 0$$'], {
                  fontSize: 14,
                  color: p.goldBright,
                  display: 'html'
                });

                // Nested intervals
                board.create('segment', [[a0, -1.8], [b0, -1.8]], { strokeColor: p.gold, strokeWidth: 4 });
                board.create('text', [4.7, -1.8, '$$[a_0, b_0]$$'], { fontSize: 13, color: p.gold, display: 'html' });

                board.create('segment', [[0.6, -2.25], [2.6, -2.25]], { strokeColor: p.cyan, strokeWidth: 4 });
                board.create('text', [2.7, -2.25, '$$[a_1, b_1]$$'], { fontSize: 13, color: p.cyan, display: 'html' });

                board.create('segment', [[1.6, -2.7], [2.6, -2.7]], { strokeColor: p.emerald, strokeWidth: 4 });
                board.create('text', [2.7, -2.7, '$$[a_2, b_2]$$'], { fontSize: 13, color: p.emerald, display: 'html' });

                board.create('line', [[c, -3.2], [c, 3.2]], { strokeColor: p.gold, strokeWidth: 1.2, dash: 3 });

                board.create('text', [0.6, 2.7, '$$\\\\lim_{n \\\\to \\\\infty} a_n = \\\\lim_{n \\\\to \\\\infty} b_n = c \\\\implies f(c) = 0$$'], {
                  fontSize: 14,
                  color: p.goldBright,
                  display: 'html'
                });

                board.renderKaTeX();
              })();

              // Board 14.2: Weierstrass Theorems & Image of Segment
              (function() {
                const board = window.createAcademicBoard('jxg-board-14-2', {
                  boundingbox: [-0.4, 4.6, 5.2, -0.6],
                  keepaspectratio: false
                });
                if (!board) return;
                const p = board.palette;
                window.createAcademicAxes(board, { grid: true });

                const a = 0.8;
                const b = 4.6;
                const f = function(x) {
                  return 2.2 + 1.45 * Math.sin(1.3 * (x - 0.8)) - 0.3 * (x - 0.8);
                };

                board.create('functiongraph', [f, a, b], {
                  strokeColor: p.cyan,
                  strokeWidth: 2.8,
                  highlight: false
                });

                const x_max = 1.88;
                const M = f(x_max);
                const x_min = 3.82;
                const m = f(x_min);

                board.create('point', [x_max, M], { name: '', size: 5, fillColor: p.goldBright, strokeColor: p.gold, fixed: true });
                board.create('point', [x_min, m], { name: '', size: 5, fillColor: p.ruby, strokeColor: p.ruby, fixed: true });

                board.create('text', [x_max - 0.2, M + 0.28, '$$M = f(x^*)$$'], { fontSize: 13, color: p.goldBright, display: 'html' });
                board.create('text', [x_min - 0.2, m - 0.28, '$$m = f(x_*)$$'], { fontSize: 13, color: p.ruby, display: 'html' });

                board.create('segment', [[0, m], [x_min, m]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });
                board.create('segment', [[0, M], [x_max, M]], { strokeColor: p.axis, strokeWidth: 1.2, dash: 3 });

                board.create('segment', [[0, m], [0, M]], { strokeColor: p.gold, strokeWidth: 5 });
                board.create('text', [-0.35, (m + M) / 2, '$$f([a,b]) = [m, M]$$'], { fontSize: 13, color: p.goldBright, display: 'html' });

                const C = 2.1;
                board.create('line', [[0, C], [5, C]], { strokeColor: p.amber, strokeWidth: 1.4, dash: 2 });
                board.create('text', [4.7, C + 0.18, '$$y = C$$'], { fontSize: 13, color: p.amber, display: 'html' });

                const c1 = 0.8;
                const c2 = 2.82;
                board.create('point', [c1, C], { name: '', size: 4, fillColor: p.emerald, fixed: true });
                board.create('point', [c2, C], { name: '', size: 4, fillColor: p.emerald, fixed: true });

                board.create('segment', [[c2, 0], [c2, C]], { strokeColor: p.emerald, strokeWidth: 1.2, dash: 3 });
                board.create('text', [c2 - 0.1, -0.25, '$$c_2$$'], { fontSize: 13, color: p.emerald, display: 'html' });

                board.create('text', [0.8, 4.15, '$$\\\\text{Непрерывный образ компакта связен и замкнут: } [m, M]$$'], {
                  fontSize: 14,
                  color: p.goldBright,
                  display: 'html'
                });

                board.renderKaTeX();
              })();
            }

            if (typeof window.safeInitAcademicBoards === 'function') {
              window.safeInitAcademicBoards(buildLecture14Boards);
            } else {
              let cnt = 0;
              const t = setInterval(function() {
                cnt++;
                if (typeof window.safeInitAcademicBoards === 'function') {
                  clearInterval(t);
                  window.safeInitAcademicBoards(buildLecture14Boards);
                } else if (cnt > 60) {
                  clearInterval(t);
                }
              }, 60);
            }

            window.addEventListener('academicThemeChanged', function() {
              buildLecture14Boards();
            });
          })();
        </script>
"""

c14 += lec14_script

with open(LEC14_CONTENT_PATH, 'w', encoding='utf-8') as f:
    f.write(c14)
print("Saved fully updated lec14_content.html")
