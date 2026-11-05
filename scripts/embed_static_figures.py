# -*- coding: utf-8 -*-
"""
Скрипт встраивания эталонных статических векторных гравюр (SVG)
в конспекты Лекции 14 и Лекции 15.
Полное удаление интерактивных скриптов JSXGraph.
"""

import os
import re

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
FIGURES_DIR = os.path.join(ROOT_DIR, 'figures')
SCRIPTS_DIR = os.path.join(ROOT_DIR, 'scripts')

def load_and_normalize_svg(filename):
    path = os.path.join(FIGURES_DIR, filename)
    with open(path, 'r', encoding='utf-8') as f:
        svg = f.read().strip()
    
    if '<?xml' in svg:
        svg = svg[svg.find('<svg'):]
    
    # Заменяем фиксированные width="...pt" и height="...pt" на адаптивные width="100%" height="auto"
    svg = re.sub(r'<svg([^>]*)width="[^"]+"([^>]*)height="[^"]+"',
                 r'<svg\1width="100%"\2height="auto" preserveAspectRatio="xMidYMid meet"',
                 svg, count=1)
    return svg

def update_lecture_15():
    content_path = os.path.join(SCRIPTS_DIR, 'lec15_content.html')
    with open(content_path, 'r', encoding='utf-8') as f:
        content = f.read()

    svg15_1 = load_and_normalize_svg('gravure_15_1.svg')
    svg15_2 = load_and_normalize_svg('gravure_15_2.svg')

    # 1. Замена первой гравюры 15.1
    pattern_fig1 = r'<figure class="figure-card">[\s\S]*?id="jxg-board-15-1a"[\s\S]*?</figure>'
    replacement_fig1 = f"""<figure class="figure-card">
          <div class="figure-svg-container">
{svg15_1}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.1.</strong> Геометрический критерий равномерной непрерывности. <em>Панель А:</em> калибр Кантора $\\delta(\\varepsilon)$ образует жесткое окно безопасности, сопровождающее график функции вдоль компакта: кривая может пересекать только боковые вертикальные границы, что гарантирует размах по вертикали не более $2\\varepsilon$. <em>Панель Б:</em> у функции $y = \\sin(1/x)$ при $x \\to +0$ частота осцилляций стремится к бесконечности; на сколь угодно малом интервале $\\delta$ размах значений равен $|f(x_n') - f(x_n'')| = 2 \\geqslant \\varepsilon_0 = 1$, что наглядно опровергает равномерную непрерывность.
          </figcaption>
        </figure>"""

    new_content, count1 = re.subn(pattern_fig1, lambda m: replacement_fig1, content)
    print(f"Lecture 15 Fig 1 replaced: {count1}")

    # 2. Замена второй гравюры 15.2
    pattern_fig2 = r'<figure class="figure-card">[\s\S]*?id="jxg-board-15-2a"[\s\S]*?</figure>'
    replacement_fig2 = f"""<figure class="figure-card">
          <div class="figure-svg-container">
{svg15_2}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 15.2.</strong> Геометрические принципы теории монотонных отображений. <em>Панель А:</em> скачок неубывающей функции порождает непустой открытый интервал $J_{{x_0}} = (f(x_0 - 0), f(x_0 + 0))$, не содержащий значений функции, нарушая связность образа $f(X)$. Внутри каждого такого интервала содержится хотя бы одно рациональное число $r \\in \\mathbb{{Q}}$, что влечет не более чем счетность точек разрыва. <em>Панель Б:</em> график обратной функции $y = f^{{-1}}(x)$ строго зеркально-симметричен графику $y = f(x)$ относительно биссектрисы $y = x$; сохранение направления строгой монотонности и промежуточности значений гарантирует непрерывность $f^{{-1}}$.
          </figcaption>
        </figure>"""

    new_content, count2 = re.subn(pattern_fig2, lambda m: replacement_fig2, new_content)
    print(f"Lecture 15 Fig 2 replaced: {count2}")

    # 3. Удаление JSXGraph скриптов в конце файла
    script_pattern = r'\s*<script>[\s\S]*?buildLecture15Boards[\s\S]*?</script>'
    new_content, count_script = re.subn(script_pattern, '', new_content)
    print(f"Lecture 15 Scripts removed: {count_script}")

    with open(content_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully saved updated: {content_path}")

def update_lecture_14():
    content_path = os.path.join(SCRIPTS_DIR, 'lec14_content.html')
    with open(content_path, 'r', encoding='utf-8') as f:
        content = f.read()

    svg14_1 = load_and_normalize_svg('gravure_14_1.svg')
    svg14_2 = load_and_normalize_svg('gravure_14_2.svg')

    # 1. Замена первой гравюры 14.1
    pattern_fig1 = r'<figure class="figure-card">[\s\S]*?id="jxg-board-14-1"[\s\S]*?</figure>'
    replacement_fig1 = f"""<figure class="figure-card">
          <div class="figure-svg-container">
{svg14_1}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.1.</strong> Геометрическая визуализация первой теоремы Больцано–Коши и алгоритма дихотомии. Непрерывная траектория $y = f(x)$, связывающая разнознаковые концы $f(a) < 0$ и $f(b) > 0$, неминуемо пересекает координатную ось. Конструктивный метод половинного деления (дихотомии) порождает систему вложенных отрезков $[a_0, b_0] \\supset [a_1, b_1] \\supset [a_2, b_2] \\dots$, длины которых стремятся к нулю, стягиваясь к единственному предельному корню $c \\in (a, b)$, в котором $f(c) = 0$.
          </figcaption>
        </figure>"""

    new_content, count1 = re.subn(pattern_fig1, lambda m: replacement_fig1, content)
    print(f"Lecture 14 Fig 1 replaced: {count1}")

    # 2. Замена второй гравюры 14.2
    pattern_fig2 = r'<figure class="figure-card">[\s\S]*?id="jxg-board-14-2"[\s\S]*?</figure>'
    replacement_fig2 = f"""<figure class="figure-card">
          <div class="figure-svg-container">
{svg14_2}
          </div>
          <figcaption class="figure-caption">
            <strong>ГРАВЮРА 14.2.</strong> Теоремы Вейерштрасса и непрерывный образ отрезка. На компакте $[a, b]$ непрерывная функция гарантированно достигает своих точных граней: глобального максимума $M = f(x^*)$ и глобального минимума $m = f(x_*)$. Проекция графика образует сплошной замкнутый отрезок $[m, M]$ на оси ординат, а любое промежуточное значение $C \\in (m, M)$ достигается хотя бы в одной точке (вторая теорема Больцано–Коши: $f(c) = C$).
          </figcaption>
        </figure>"""

    new_content, count2 = re.subn(pattern_fig2, lambda m: replacement_fig2, new_content)
    print(f"Lecture 14 Fig 2 replaced: {count2}")

    # 3. Удаление JSXGraph скриптов в конце файла
    script_pattern = r'\s*<script>[\s\S]*?buildLecture14Boards[\s\S]*?</script>'
    new_content, count_script = re.subn(script_pattern, '', new_content)
    print(f"Lecture 14 Scripts removed: {count_script}")

    with open(content_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Successfully saved updated: {content_path}")

def main():
    update_lecture_15()
    update_lecture_14()

if __name__ == '__main__':
    main()
